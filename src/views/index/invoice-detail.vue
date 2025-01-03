<template>
  <div v-if="invoice" class="invoice-detail">
    <ElDescriptions border size="small" direction="vertical" :column="4">
      <ElDescriptionsItem label="发票图片">
        <el-image :src="invoice.base64" :preview-src-list="[invoice.base64]" />
      </ElDescriptionsItem>
      <ElDescriptionsItem v-for="item in invoice.ocrTicket?.realResult" :label="item.name">
        <template v-if="item.index === EOcrTicketIndex.TOTAL_LOWER">
          <el-tag type="danger">{{ item.value }}</el-tag>
        </template>
        <template v-else> {{ item.value }}</template>
      </ElDescriptionsItem>
    </ElDescriptions>
  </div>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue'
import type { IData } from './typing'
import { EOcrTicketIndex } from '@/api/ocr'

defineProps({
  invoice: { type: Object as PropType<IData['invoice']> },
})
</script>

<style lang="scss" scoped>
.invoice-detail {
  .el-image {
    height: 50px;
  }

  :deep(.el-descriptions__table) {
    table-layout: fixed;
  }
}
</style>
