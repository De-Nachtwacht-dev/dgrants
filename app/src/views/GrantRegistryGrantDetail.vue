<template>
  <!-- Transaction Loading Page -->
  <div v-if="txHash">
    <BaseHeader name="Update Grant : Transaction Status" />
    <TransactionStatus :hash="txHash" buttonLabel="CONTINUE" :buttonAction="() => cancelEdits()" />
  </div>

  <!-- Grant has loaded -->
  <template v-else-if="!loading && grant">
    <!-- Grant details -->
    <div v-if="!isEditing">
      <BaseHeader
        :breadcrumbContent="breadcrumb"
        :name="grantMetadata?.name || ''"
        :owner="grant.owner"
        :nextPath="nextGrant"
        :lastPath="lastGrant"
      />

      <!-- grant details row ( image + raised, address, in round, matchin, add to cart button ) -->
      <GrantDetailsRow
        :grant="grant"
        :logoPtr="grantMetadata?.logoPtr"
        :payoutAddress="grant.payee"
        :totalRaised="grantContributionsTotal"
        :roundDetails="grantContributionsByRound"
      />

      <!-- Interactions Bar for Tweet, Collection, Edit and so on  -->
      <div class="px-4 md:px-12 py-8 border-b border-grey-100">
        <div class="flex flex-wrap gap-x-6 gap-y-4">
          <!-- tweets the url of this grant -->

          <a
            target="_blank"
            rel="noreferrer noopener"
            :href="
              'https://twitter.com/intent/tweet' +
              '?text=' +
              encodeURIComponent(
                `Check out the ${grantMetadata?.name} grant on the new Gitcoin DAO decentralized grants platform!`
              ) +
              '&url=' +
              encodeURIComponent('https://grants.gtcdao.net/#') +
              $route.path
            "
            class="flex items-center gap-x-2 cursor-pointer group ml-auto"
          >
            <TwitterIcon class="icon icon-primary icon-small" />
            <span class="text-grey-400 group-hover:text-grey-500">Tweet</span>
          </a>

          <!--edit for owner-->
          <div v-if="isOwner" @click="enableEdit()" class="flex items-center gap-x-2 cursor-pointer group">
            <EditIcon class="icon icon-primary icon-small" />
            <span class="text-grey-400 group-hover:text-grey-500">Edit</span>
          </div>
        </div>
      </div>

      <SectionHeader title="Description" />
      <div class="border-b border-grey-100">
        <p style="white-space: pre-line" class="text-indent px-4 md:px-12 py-12 mx-auto max-w-6xl">
          {{ grantMetadata?.description }}
        </p>
      </div>

      <!-- LINKS -->
      <template v-if="areLinksDefined">
        <SectionHeader title="Links" />
        <div class="px-4 md:px-12 py-8 border-b border-grey-100 flex flex-col gap-y-4">
          <div v-if="isDefined(grantMetadata?.properties?.websiteURI)" class="flex gap-x-4">
            <span class="text-grey-400">Website:</span>
            <a :href="grantMetadata?.properties?.websiteURI" class="link" target="_blank">
              {{ grantMetadata?.properties?.websiteURI }}
            </a>
          </div>

          <div v-if="isDefined(grantMetadata?.properties?.githubURI)" class="flex gap-x-4">
            <span class="text-grey-400">Github:</span>
            <a :href="grantMetadata?.properties?.githubURI" class="link" target="_blank">
              {{ grantMetadata?.properties?.githubURI }}
            </a>
          </div>

          <div v-if="isDefined(grantMetadata?.properties?.twitterURI)" class="flex gap-x-4">
            <span class="text-grey-400">Twitter:</span>
            <a :href="grantMetadata?.properties?.twitterURI" class="link" target="_blank">
              {{ grantMetadata?.properties?.twitterURI }}
            </a>
          </div>
        </div>
      </template>

      <!-- CONTRIBUTIONS -->
      <template v-if="grantContributions.length > 0">
        <SectionHeader title="Contributions" />
        <div>
          <BaseFilterNav :active="selectedRound" :items="contributionsNav" />
          <div v-if="selectedRound == 0">
            <div v-for="(contribution, index) in grantContributions" :key="Number(index)">
              <ContributionRow :contribution="contribution" :donationToken="donationToken" />
            </div>
          </div>
          <div v-else>
            <div
              v-for="(contribution, index) in grantContributionsByRound[selectedRound - 1].contributions"
              :key="Number(index)"
            >
              <ContributionRow :contribution="contribution" :donationToken="donationToken" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Editing grant -->
    <div v-else class="flex flex-col justify-center sm:px-6 lg:px-8">
      <BaseHeader name="Edit Grant" :tagline="grantMetadata?.name" />
      <BaseFilterNav :active="selectedEdit" :items="editNav" />

      <div v-if="selectedEdit == 0" class="text-left">
        <form class="space-y-5 mb-20" @submit.prevent="saveEdits">
          <!-- Grant name -->
          <InputRow>
            <template v-slot:label>Title:</template>
            <template v-slot:input>
              <BaseInput
                v-model="form.name"
                width="w-full"
                placeholder="Grant name"
                id="grant-name"
                :rules="isDefined"
                errorMsg="Please enter a name"
              />
            </template>
          </InputRow>

          <!-- Owner address -->
          <InputRow text="has permission to edit the grant">
            <template v-slot:label>Owner Adddress:</template>
            <template v-slot:input>
              <BaseInput
                v-model="form.owner"
                width="w-full"
                id="owner-address"
                placeholder="owner ethereum address"
                :rules="isValidAddress"
                errorMsg="Please enter a valid address"
              />
            </template>
          </InputRow>

          <!-- Payee address -->
          <InputRow text="address all contributions and matching funds are sent to">
            <template v-slot:label>Payee Adddress:</template>
            <template v-slot:input>
              <BaseInput
                v-model="form.payee"
                width="w-full"
                placeholder="payee ethereum address"
                id="payee-address"
                :rules="isValidAddress"
                errorMsg="Please enter a valid address"
              />
            </template>
          </InputRow>

          <!-- Grant Description -->
          <InputRow>
            <template v-slot:label>Description:</template>
            <template v-slot:input>
              <BaseTextarea
                v-model="form.description"
                width="w-full"
                :placeholder="LOREM_IPSOM_TEXT"
                id="grant-description"
                :required="true"
                :rules="isDefined"
                errorMsg="Please enter a description"
              />
            </template>
          </InputRow>

          <!-- Grant website -->
          <InputRow>
            <template v-slot:label>Website:</template>
            <template v-slot:input>
              <BaseInput
                v-model="form.website"
                width="w-full"
                placeholder="https://"
                id="grant-website"
                :rules="isValidWebsite"
                errorMsg="Please enter a valid URL"
                :required="false"
              />
            </template>
          </InputRow>

          <!-- Grant github -->
          <InputRow>
            <template v-slot:label>Github:</template>
            <template v-slot:input>
              <BaseInput
                v-model="form.github"
                width="w-full"
                placeholder="https://"
                id="grant-github"
                :rules="isValidGithub"
                errorMsg="Please enter a valid Github URL"
                :required="false"
              />
            </template>
          </InputRow>

          <!-- Grant twitter handle -->
          <InputRow>
            <template v-slot:label>Twitter:</template>
            <template v-slot:input>
              <BaseInput
                v-model="form.twitter"
                width="w-full"
                placeholder="@twitterhandle"
                id="grant-handle"
                :rules="isValidTwitter"
                errorMsg="Please enter a valid Twitter handle"
                :required="false"
              />
            </template>
          </InputRow>

          <!-- Grant logo -->
          <InputRow>
            <template v-slot:label>Logo:</template>
            <template v-slot:input>
              <BaseImageUpload
                v-model="form.logo"
                :logoURI="form.logoURI"
                width="w-full"
                id="grant-logo"
                :rules="isValidLogo"
                errorMsg="Logo must be in png, jpg, or svg format, under 512 kB, with dimensions of at least 500x500"
                :required="false"
                @update:modelValue="updateLogo"
                :isUploading="isUploadingLogo"
              />
            </template>
          </InputRow>

          <!-- Submit and cancel buttons -->
          <div class="flex justify-end">
            <button
              type="submit"
              class="btn btn-primary mr-6"
              :class="{ disabled: !isFormValid || !isCorrectNetwork }"
              :disabled="!isFormValid || !isCorrectNetwork"
            >
              Update Grant
            </button>
            <button @click.prevent="cancelEdits" class="btn btn-outline">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </template>

  <!-- No grant selected -->
  <div v-else-if="!loading">
    <h2 class="mt-6">No grant selected</h2>
  </div>

  <LoadingSpinner v-else />
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
// --- Store ---
import useCartStore from 'src/store/cart';
import useDataStore from 'src/store/data';
import useWalletStore from 'src/store/wallet';
// --- Methods and Data ---
import { LOREM_IPSOM_TEXT, NO_LOGO_OBJECT } from 'src/utils/constants';
import { ContractTransaction } from 'src/utils/ethers';
import { DGRANTS_CHAIN_ID } from 'src/utils/chains';
import {
  cleanTwitterUrl,
  formatNumber,
  isDefined,
  isValidAddress,
  isValidGithub,
  isValidLogo,
  isValidTwitter,
  isValidWebsite,
  metadataId,
  urlFromTwitterHandle,
  watchTransaction,
} from 'src/utils/utils';
import * as ipfs from 'src/utils/data/ipfs';
import { getGrantsGrantRoundDetails } from 'src/utils/data/grantRounds';
import { filterContributionsByGrantId } from 'src/utils/data/contributions';
// --- Types ---
import { Breadcrumb, FilterNavItem, GrantsRoundDetails, MetaPtr } from '@dgrants/types';
// --- Components ---
import BaseInput from 'src/components/BaseInput.vue';
import BaseImageUpload from 'src/components/BaseImageUpload.vue';
import BaseTextarea from 'src/components/BaseTextarea.vue';
import BaseHeader from 'src/components/BaseHeader.vue';
import InputRow from 'src/components/InputRow.vue';
import SectionHeader from 'src/components/SectionHeader.vue';
import BaseFilterNav from 'src/components/BaseFilterNav.vue';
import ContributionRow from 'src/components/ContributionRow.vue';
import GrantDetailsRow from 'src/components/GrantDetailsRow.vue';
import TransactionStatus from 'src/components/TransactionStatus.vue';
import LoadingSpinner from 'src/components/LoadingSpinner.vue';
// --- Icons ---
import { TwitterIcon } from '@fusion-icons/vue/interface';
import { Edit3Icon as EditIcon } from '@fusion-icons/vue/interface';

const grantIdList = ref([]);

function useGrantDetail() {
  // --- get current state ---
  const {
    grants,
    grantMetadata: metadata,
    grantRounds: rounds,
    grantRoundMetadata: roundsMetadata,
    grantRoundsCLRData: roundsCLRData,
    grantContributions: allContributions,
    grantRoundsDonationToken: donationToken,
  } = useDataStore();
  const { signer, userAddress, grantRegistry, isCorrectNetwork } = useWalletStore();
  const route = useRoute();

  // --- expose grant data ---
  const grant = computed(() => {
    if (!grants.value) return null; // array type unsupported
    return grants.value[grantId.value];
  });
  const grantId = computed(() => Number(route.params.id));
  const grantMetadata = computed(() => (grant.value ? metadata.value[metadataId(grant.value.metaPtr)] : null));

  // --- expose Grant/round details ---
  const loading = ref(true);
  const selectedRound = ref(0);
  const selectedEdit = ref(0);
  const grantContributions = ref();
  const grantContributionsTotal = ref();
  const grantContributionsByRound = ref();
  const txHash = ref<string>();

  watch(
    () => [grant.value, grantId.value, rounds.value, roundsCLRData.value],
    () => {
      // enter loading state between loads
      loading.value = true;
      // ensure the computed props are ready before fetching data
      if (donationToken.value && rounds.value && roundsCLRData.value) {
        // get all contributions for this grant
        const contributions = filterContributionsByGrantId(grantId.value, allContributions.value);
        // sum all contributions made against this grant
        const contributionsTotal = `${formatNumber(
          contributions.reduce((total, contribution) => contribution?.amount + total, 0),
          2
        )} ${rounds.value && donationToken.value.symbol}`;
        // collect this grants details from every round that it is a member of (should we use the metadata here?)
        const contributionsByRound = getGrantsGrantRoundDetails(
          grantId.value,
          rounds.value,
          roundsMetadata.value,
          roundsCLRData.value,
          contributions
        );
        // save off data
        grantContributions.value = contributions;
        grantContributionsTotal.value = contributionsTotal;
        grantContributionsByRound.value = contributionsByRound;

        // finished loading required state
        loading.value = false;
      }
    },
    { immediate: true }
  );

  // --- BaseHeader Navigation ---
  const breadcrumb = computed(() =>
    route.query.roundName && route.query.roundAddress
      ? <Breadcrumb[]>[
          {
            displayName: 'dgrants',
            routeTarget: { name: 'Home' },
          },
          {
            displayName: 'rounds',
            routeTarget: { name: 'dgrants-rounds-list' },
          },
          {
            displayName: route.query.roundName,
            routeTarget: { name: 'dgrants-round', params: { address: route.query.roundAddress } },
          },
          {
            displayName: `#${grantId.value}`,
            routeTarget: { name: 'dgrants-id', params: { id: grantId.value } },
          },
        ]
      : <Breadcrumb[]>[
          {
            displayName: 'dgrants',
            routeTarget: { name: 'Home' },
          },
          {
            displayName: 'registry',
            routeTarget: { name: 'dgrants' },
          },
          {
            displayName: `#${grantId.value}`,
            routeTarget: { name: 'dgrants-id', params: { id: grantId.value } },
          },
        ]
  );
  const getGrantTargetFor = (grantid: number) => {
    if (!grants.value) return undefined; // array type unsupported
    return grants.value[grantid] ? { name: 'dgrants-id', params: { id: grantid } } : undefined;
  };
  const nextGrant = computed(() => {
    let nextIndex = grantId.value + 1;
    const idList = grantIdList.value as Array<number>;
    const len = grants.value ? grants.value.length : 0;
    for (let i = 0; i < len; i++) {
      if (idList.includes(nextIndex)) {
        break;
      }
      nextIndex++;
    }
    return getGrantTargetFor(nextIndex);
  });
  const lastGrant = computed(() => {
    let lastIndex = grantId.value - 1;
    const idList = grantIdList.value as Array<number>;
    const len = grants.value ? grants.value.length : 0;
    for (let i = 0; i < len; i++) {
      if (idList.includes(lastIndex)) {
        break;
      }
      lastIndex--;
    }
    return getGrantTargetFor(lastIndex);
  });

  // --- Contribution display details ---
  const contributionsNav = computed(
    () =>
      <FilterNavItem[]>[
        {
          label: 'All Rounds',
          counter: grantContributions.value?.length,
          action: () => {
            selectedRound.value = 0;
          },
        },
        ...(grantContributionsByRound.value || []).map((round: GrantsRoundDetails, index: number) => {
          return {
            label: round?.name,
            counter: round?.contributions?.length,
            action: () => {
              selectedRound.value = index + 1;
            },
          };
        }),
      ]
  );

  // --- Edit Grant display details ---
  const editNav = computed(
    () =>
      <FilterNavItem[]>[
        {
          label: 'Details',
          action: () => {
            selectedEdit.value = 0;
          },
        },
      ]
  );

  const areLinksDefined = computed(
    () =>
      isDefined(grantMetadata.value?.properties?.websiteURI) ||
      isDefined(grantMetadata.value?.properties?.githubURI) ||
      isDefined(grantMetadata.value?.properties?.twitterURI)
  );

  // --- Edit capabilities ---
  const isOwner = computed(() => userAddress.value === grant.value?.owner);
  const isEditing = ref(false);
  const isUploadingLogo = ref<boolean>(false);

  const form = ref<{
    owner: string;
    payee: string;
    name: string;
    description: string;
    website: string;
    github: string;
    twitter: string;
    logo: File | undefined;
    logoURI: string | undefined;
  }>({
    owner: grant.value?.owner || '',
    payee: grant.value?.payee || '',
    name: grantMetadata.value?.name || '',
    description: grantMetadata.value?.description || '',
    website: grantMetadata.value?.properties?.websiteURI || '',
    github: grantMetadata.value?.properties?.githubURI || '',
    twitter: cleanTwitterUrl(grantMetadata.value?.properties?.twitterURI) || '',
    logo: undefined,
    logoURI: undefined,
  });

  const isLogoValid = ref(true);
  const isFormValid = computed(() => {
    if (!grant.value) return false;
    const { owner, payee, name, description, website, github, twitter, logoURI } = form.value;
    const areFieldsValid =
      isValidAddress(owner) &&
      isValidAddress(payee) &&
      isDefined(name) &&
      isDefined(description) &&
      isValidWebsite(website) &&
      isValidGithub(github) &&
      isValidTwitter(twitter) &&
      isLogoValid.value;

    const areFieldsUpdated =
      owner !== grant.value.owner ||
      payee !== grant.value.payee ||
      name !== grantMetadata.value?.name ||
      description !== grantMetadata.value?.description ||
      website !== grantMetadata.value?.properties?.websiteURI ||
      github !== grantMetadata.value?.properties?.githubURI ||
      twitter !== cleanTwitterUrl(grantMetadata.value?.properties?.twitterURI) ||
      logoURI !== ipfs.getMetaPtr({ cid: (grantMetadata.value?.logoPtr as MetaPtr).pointer });

    return areFieldsValid && areFieldsUpdated;
  });

  async function updateLogo(logo: File | undefined) {
    isLogoValid.value = await isValidLogo(logo);
    if (isLogoValid.value) isUploadingLogo.value = true;
    form.value.logo = logo && isLogoValid.value ? logo : undefined;
    try {
      form.value.logoURI = logo
        ? await ipfs.uploadFile(logo).then((cid) => ipfs.getMetaPtr({ cid: cid.toString() }))
        : '';
      isUploadingLogo.value = false;
    } catch (err) {
      isUploadingLogo.value = false;
      throw err;
    }
  }

  /**
   * @notice Resets the form values that user may have changed, and hides the edit window
   */
  function cancelEdits() {
    prefillEditForm();

    // Hide edit form
    isEditing.value = false;
    txHash.value = undefined;
  }

  /**
   * @notice Saves edits
   */
  const saveEdits = async () => {
    // Validation
    const { owner, payee, name, description, website, github, twitter, logoURI } = form.value;
    if (!grant.value) throw new Error('No grant selected');
    if (!signer.value) throw new Error('Please connect a wallet');
    if (!isCorrectNetwork.value) throw new Error('Wrong network');

    // Get registry instance
    const registry = grantRegistry.value;

    // Determine which update method to call
    let txCall: () => Promise<ContractTransaction>;
    const g = grant.value; // for better readability in the if statements
    let metaPtr = g.metaPtr;

    const gMetadata = grantMetadata.value;
    const isMetaPtrUpdated =
      name !== gMetadata?.name ||
      description !== gMetadata?.description ||
      logoURI !== ipfs.getMetaPtr({ cid: (gMetadata?.logoPtr as MetaPtr).pointer }) ||
      website !== gMetadata?.properties?.websiteURI ||
      github !== gMetadata?.properties?.githubURI ||
      twitter !== cleanTwitterUrl(gMetadata?.properties?.twitterURI);

    if (isMetaPtrUpdated) {
      const twitterURI = twitter === '' ? twitter : urlFromTwitterHandle(twitter);
      const properties = { websiteURI: website, githubURI: github, twitterURI };
      const cid = logoURI ? (gMetadata?.logoPtr as MetaPtr).pointer : '';
      const logoPtr = cid ? ipfs.formatMetaPtr(cid) : NO_LOGO_OBJECT;
      metaPtr = await ipfs
        .uploadGrantMetadata({ name, description, logoPtr, properties })
        .then((cid) => ipfs.formatMetaPtr(cid.toString()));
    }

    if (owner !== g.owner && payee === g.payee && !isMetaPtrUpdated) {
      // update Grant Owner
      txCall = () => registry.updateGrantOwner(g.id, owner);
    } else if (owner === g.owner && payee !== g.payee && !isMetaPtrUpdated) {
      // update Grant Payee
      txCall = () => registry.updateGrantPayee(g.id, payee);
    } else if (owner === g.owner && payee === g.payee && isMetaPtrUpdated) {
      // update Grant MetaPtr
      txCall = () => registry.updateGrantMetaPtr(g.id, metaPtr);
    } else {
      // update all
      txCall = () => registry.updateGrant(g.id, owner, payee, metaPtr);
    }

    // watch the transaction to check for any replacements/cancellations and update txHash accordingly
    await watchTransaction(txCall, txHash);
  };

  /**
   * @notice Loads the default values into edit form, and shows the edit window
   */
  function enableEdit() {
    prefillEditForm();

    // Enable edit form
    isEditing.value = true;
  }

  /**
   * @notice util function which prefills edit form
   */
  function prefillEditForm() {
    // TOOD probably shouldn't assume logoURI is defined since the type definition makes it optional, but our UI
    // requires a logo, so maybe this is fine for now. Also don't know why TS makes me cast like this, but the
    // type inference hints from VSCode indicate the casting shouldn't be necessary
    form.value.owner = grant.value?.owner || '';
    form.value.payee = grant.value?.payee || '';
    form.value.name = grantMetadata.value?.name || '';
    form.value.description = grantMetadata.value?.description || '';
    form.value.logoURI = ipfs.getMetaPtr({ cid: grantMetadata.value?.logoPtr?.pointer }) || undefined;
    form.value.website = grantMetadata.value?.properties?.websiteURI || '';
    form.value.github = grantMetadata.value?.properties?.githubURI || '';
    form.value.twitter = cleanTwitterUrl(grantMetadata.value?.properties?.twitterURI) || '';
  }

  onMounted(() => {
    /**
     * @notice auto open if URL has query edits
     */
    if (route.query && route.query.edit && isOwner) {
      enableEdit();
    }
  });

  return {
    donationToken,
    updateLogo,
    loading,
    grantId,
    rounds,
    isEditing,
    isOwner,
    isValidAddress,
    isValidWebsite,
    isValidGithub,
    isValidTwitter,
    isValidLogo,
    isDefined,
    isCorrectNetwork,
    isFormValid,
    grant,
    grantMetadata,
    form,
    cancelEdits,
    saveEdits,
    enableEdit,
    breadcrumb,
    contributionsNav,
    editNav,
    nextGrant,
    lastGrant,
    selectedRound,
    selectedEdit,
    grantContributions,
    grantContributionsTotal,
    grantContributionsByRound,
    LOREM_IPSOM_TEXT,
    txHash,
    areLinksDefined,
    isUploadingLogo,
  };
}

export default defineComponent({
  name: 'GrantRegistryGrantDetail',
  components: {
    BaseFilterNav,
    BaseHeader,
    BaseInput,
    BaseImageUpload,
    BaseTextarea,
    ContributionRow,
    EditIcon,
    GrantDetailsRow,
    InputRow,
    SectionHeader,
    TwitterIcon,
    TransactionStatus,
    LoadingSpinner,
  },
  setup() {
    const { addToCart, isInCart, removeFromCart } = useCartStore();

    watch(
      () => [],
      async () => {
        const uniqueStr = '?unique=' + Date.now();
        const whitelistUrl = import.meta.env.VITE_GRANT_WHITELIST_URI;
        if (whitelistUrl) {
          const url = whitelistUrl + uniqueStr;
          const json = await fetch(url).then((res) => res.json());
          grantIdList.value = json[DGRANTS_CHAIN_ID];
        }
      },
      { immediate: true }
    );

    return { isInCart, addToCart, removeFromCart, ...useGrantDetail() };
  },
});
</script>
