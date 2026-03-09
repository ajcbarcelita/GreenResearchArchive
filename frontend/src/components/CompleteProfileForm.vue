<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  programs: {
    type: Array,
    default: () => [],
  },
  loadingPrograms: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  initialProfile: {
    type: Object,
    default: () => ({}),
  },
  requiresProgram: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['submit-profile'])

const firstName = ref('')
const lastName = ref('')
const middleName = ref('')
const universityId = ref('')
const selectedProgramId = ref(null)
const localValidationMessage = ref('')
const toast = useToast()

const showInvalidToast = (detail) => {
  toast.add({
    severity: 'warn',
    summary: 'Invalid Input',
    detail,
    life: 3000,
  })
}

const normalizeUniversityIdInput = (value = '') => value.replace(/\D/g, '').slice(0, 8)

const dropdownOptions = computed(() =>
  props.programs.map((program) => ({
    label: `${program.program_code} - ${program.program_name} (${program.program_level})`,
    value: program.program_id,
  })),
)

const submit = () => {
  localValidationMessage.value = ''

  if (!firstName.value.trim()) {
    const message = 'First name is required.'
    localValidationMessage.value = message
    showInvalidToast(message)
    return
  }

  if (!lastName.value.trim()) {
    const message = 'Last name is required.'
    localValidationMessage.value = message
    showInvalidToast(message)
    return
  }

  if (props.requiresProgram && !selectedProgramId.value) {
    const message = 'Degree program is required.'
    localValidationMessage.value = message
    showInvalidToast(message)
    return
  }

  const normalizedUniversityId = normalizeUniversityIdInput(universityId.value)
  if (!/^\d{8}$/.test(normalizedUniversityId)) {
    const message = 'University ID must be exactly 8 digits.'
    localValidationMessage.value = message
    showInvalidToast(message)
    return
  }

  emit('submit-profile', {
    universityId: normalizedUniversityId,
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    middleName: middleName.value.trim(),
    programId: props.requiresProgram ? selectedProgramId.value : null,
  })
}

watch(
  () => props.initialProfile,
  (profile) => {
    firstName.value = profile?.firstName || ''
    lastName.value = profile?.lastName || ''
    middleName.value = profile?.middleName || ''
    // University ID must be manually filled by the user.
    universityId.value = ''
    selectedProgramId.value = profile?.programId || null
  },
  { immediate: true },
)

watch(universityId, (value) => {
  const normalized = normalizeUniversityIdInput(value)
  if (value !== normalized) {
    universityId.value = normalized
  }
})
</script>

<template>
  <Card class="complete-profile-card">
    <template #title>
      Complete Your Profile
    </template>

    <template #content>
      <p class="subtitle">
        Confirm your profile details before you can continue to the repository.
      </p>

      <div v-if="requiresProgram && loadingPrograms" class="loading-block">
        <ProgressSpinner style="width: 36px; height: 36px" strokeWidth="6" />
        <span>Loading degree programs...</span>
      </div>

      <div v-else class="form-block">
        <div class="field-group">
          <label for="university-id" class="field-label">University ID</label>
          <InputText
            id="university-id"
            v-model="universityId"
            class="w-full"
            :maxlength="8"
            :disabled="submitting"
            autocomplete="off"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 12345678"
          />
        </div>

        <div class="field-group">
          <label for="first-name" class="field-label">First Name</label>
          <InputText id="first-name" v-model="firstName" class="w-full" :disabled="submitting" />
        </div>

        <div class="field-group">
          <label for="last-name" class="field-label">Last Name</label>
          <InputText id="last-name" v-model="lastName" class="w-full" :disabled="submitting" />
        </div>

        <div class="field-group middle-name-field">
          <label for="middle-name" class="field-label">Middle Name (Optional)</label>
          <InputText id="middle-name" v-model="middleName" class="w-full" :disabled="submitting" />
        </div>

        <div v-if="requiresProgram" class="field-group">
          <label for="program-select" class="field-label">Degree Program</label>
          <Dropdown
            id="program-select"
            v-model="selectedProgramId"
            :options="dropdownOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select your degree program"
            class="w-full"
            :disabled="submitting"
          />
        </div>
      </div>

      <Message v-if="localValidationMessage" severity="warn" :closable="false" class="mt-4">
        {{ localValidationMessage }}
      </Message>
      <Message v-if="errorMessage" severity="error" :closable="false" class="mt-4">
        {{ errorMessage }}
      </Message>
    </template>

    <template #footer>
      <Button
        label="Save and Continue"
        class="w-full"
        :loading="submitting"
        :disabled="(requiresProgram && loadingPrograms) || submitting"
        @click="submit"
      />
    </template>
  </Card>
</template>

<style scoped>
.subtitle {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #395347;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #1f3d31;
}

.loading-block {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #395347;
  min-height: 3rem;
}

.complete-profile-card {
  width: 100%;
  max-width: 42rem;
}

:deep(.complete-profile-card.p-card) {
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  box-shadow: none;
  color: #111827;
}

:deep(.complete-profile-card.p-card:hover) {
  border-color: #0e662e;
}

:deep(.complete-profile-card .p-card-title),
:deep(.complete-profile-card .p-card-content),
:deep(.complete-profile-card .p-card-footer) {
  color: #111827;
}

:deep(.complete-profile-card .p-inputtext),
:deep(.complete-profile-card .p-select),
:deep(.complete-profile-card .p-select-label) {
  background-color: #ffffff;
  border-color: #d1d5db;
  color: #111827;
}

.form-block {
  display: grid;
  gap: 0.9rem;
}

.field-group {
  display: grid;
  gap: 0.45rem;
}

.middle-name-field {
  margin-bottom: 1.25rem;
}
</style>
