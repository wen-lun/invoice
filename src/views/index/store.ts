import { defineStore } from 'pinia'
import type { IForm } from './typing'

export const useStore = defineStore('invoice.index', {
  state: (): { form: IForm } => {
    return {
      form: {
        data: [{}],
        subsidy: [{ type: '出差补贴' }],
      },
    }
  },
  persist: true,
})
