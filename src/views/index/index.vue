<template>
  <div class="index">
    <input
      ref="refImportInputFile"
      type="file"
      style="display: none"
      accept="application/json"
      @change="onImportFileChange"
    />
    <div class="flex">
      <ElFormItem label="出差人">
        <ElSelect
          v-model="form.user"
          filterable
          allow-create
          default-first-option
          multiple
          collapse-tags
          :max-collapse-tags="2"
          collapse-tags-tooltip
          :reserve-keyword="false"
          style="width: 230px"
        >
          <ElOption v-for="user in users" :value="user"></ElOption>
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="地点">
        <ElInput v-model="form.location" style="width: 100px" />
      </ElFormItem>
      <ElFormItem label="日期">
        <ElDatePicker
          v-model="form.dateRange"
          type="daterange"
          range-separator="至"
          value-format="YYYY-MM-DD"
          style="width: 220px"
        />
      </ElFormItem>
      <ElFormItem label="文件名">
        <ElInput
          v-model="form.fileName"
          placeholder="张三重庆出差支出说明-20241231"
          style="width: 260px"
        />
      </ElFormItem>
      <div>
        <ElSpace :size="5">
          <ElDropdown @command="onCommand">
            <ElButton type="primary">
              操作
              <ElIcon class="el-icon--right">
                <arrow-down />
              </ElIcon>
            </ElButton>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :icon="Download" command="importJson">导入 json</el-dropdown-item>
                <el-dropdown-item divided :icon="Upload" command="exportWord"
                  >导出 word</el-dropdown-item
                >
                <el-dropdown-item :icon="Upload" command="exportJson">导出 json</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </ElDropdown>
          <ElPopconfirm title="确定要清空内容吗？" @confirm="store.$reset()">
            <template #reference>
              <ElButton type="danger">清空</ElButton>
            </template>
          </ElPopconfirm>
        </ElSpace>
      </div>
    </div>
    <div class="tips">
      说明：选择发票文件后，会自动识别发票金额并回填，同时文件名也会回填到备注，支持选择pdf文件或图片。
    </div>
    <table class="table">
      <colgroup>
        <col width="60" />
        <col />
        <col />
        <col />
        <col />
        <col />
        <col />
        <col width="60" />
      </colgroup>
      <tbody>
        <tr>
          <td>序号</td>
          <td>项目</td>
          <td>日期</td>
          <td>金额</td>
          <td>经手人</td>
          <td>发票</td>
          <td>备注</td>
          <td>操作</td>
        </tr>
        <tr v-for="(item, index) in sortData" :key="index">
          <td>{{ index + 1 }}</td>
          <td>
            <ElSelect
              v-model="item.type"
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
            >
              <ElOption v-for="type in invoiceTypes" :value="type"></ElOption>
            </ElSelect>
          </td>
          <td>
            <ElDatePicker v-model="item.date" type="date" value-format="YYYY-MM-DD" />
          </td>
          <td>
            <ElInputNumber v-model="item.amount" :min="0" controls-position="right" />
          </td>
          <td>
            <ElSelect
              v-model="item.user"
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
            >
              <ElOption v-for="user in users" :value="user"></ElOption>
            </ElSelect>
          </td>
          <td>
            <input
              ref="refInputFiles"
              type="file"
              style="display: none"
              accept="application/pdf,image/*"
              @change="onFileChange($event, index)"
            />
            <ElButton
              v-if="!item.invoice"
              type="primary"
              text
              :loading="loadings[index]"
              @click="onSelectFileClick(index)"
            >
              选择文件
            </ElButton>
            <div v-else>
              <ElPopover trigger="click" :width="600" placement="left">
                <InvoiceDetail :invoice="item.invoice" />
                <template #reference>
                  <ElButton type="primary" text>查看</ElButton>
                </template>
              </ElPopover>
              <ElButton
                type="primary"
                text
                :loading="loadings[index]"
                @click="onSelectFileClick(index)"
              >
                重选
              </ElButton>
            </div>
          </td>
          <td>
            <ElInput v-model="item.remarks" type="textarea" :rows="2" resize="none" />
          </td>
          <td>
            <ElPopconfirm title="确定要删除吗？" @confirm="form.data.splice(index, 1)">
              <template #reference>
                <ElLink type="danger" :disabled="form.data.length === 1"> 删除 </ElLink>
              </template>
            </ElPopconfirm>
          </td>
        </tr>
        <tr>
          <td :colspan="COL" class="center">
            <el-button type="info" size="small" @click="form.data.push({})">添加项目</el-button>
          </td>
        </tr>
        <tr v-for="(item, index) in form.subsidy" :key="index">
          <td></td>
          <td>{{ item.type }}</td>
          <td>
            <ElDatePicker
              v-model="item.dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              @change="onSubSidyDateChange(item)"
            />
          </td>
          <td>{{ item.amount }}</td>
          <td>
            <ElSelect
              v-model="item.user"
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
            >
              <ElOption v-for="user in users" :value="user"></ElOption>
            </ElSelect>
          </td>
          <td>{{ item.remarks }}</td>
          <td></td>
          <td>
            <ElPopconfirm title="确定要删除吗？" @confirm="form.subsidy.splice(index, 1)">
              <template #reference>
                <ElLink type="danger" :disabled="form.subsidy.length === 1"> 删除 </ElLink>
              </template>
            </ElPopconfirm>
          </td>
        </tr>
        <tr>
          <td :colspan="COL" class="center">
            <el-button type="info" size="small" @click="form.subsidy.push({ type: '出差补贴' })">
              添加补贴
            </el-button>
          </td>
        </tr>
        <tr>
          <td></td>
          <td>以上总计</td>
          <td></td>
          <td>{{ totalAmount }}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>
    <div class="tip">发票凭证如下：</div>
    <div class="list">
      <div v-for="(item, i) in sortData" class="item">
        <div class="label">{{ i + 1 }}、{{ item.remarks }}</div>
        <el-image
          v-if="item.invoice?.base64"
          :src="item.invoice?.base64"
          :preview-src-list="[item.invoice.base64]"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch, useTemplateRef, ref, toRaw } from 'vue'
import type { IData, IForm } from './typing'
import {
  calcSubsidyAmount,
  calcTotalAmount,
  genWord,
  parseSubsidyRemarks,
  parseFile,
} from './utils'
import { invoiceTypes } from '@/constant/common'
import { dayjs, ElMessage, ElMessageBox } from 'element-plus'
import { useStore } from './store'
import { storeToRefs } from 'pinia'
import { api } from '@/api'
import InvoiceDetail from './invoice-detail.vue'
import { EOcrTicketIndex } from '@/api/ocr'
import { ArrowDown, Download, Upload } from '@element-plus/icons-vue'
import FileSaver from 'file-saver'

const store = useStore()

const COL = 8
const { form } = storeToRefs(store)
const loadings = ref<Record<number, boolean>>({})
const refImportInputFile = ref<HTMLInputElement>()
const refInputFiles = useTemplateRef<HTMLInputElement[]>('refInputFiles')

const users = computed(() => {
  const set = new Set<string>()
  if (form.value.user?.length) {
    for (const u of form.value.user) {
      set.add(u)
    }
  }
  for (const item of form.value.data) {
    if (item.user) set.add(item.user)
  }
  for (const item of form.value.subsidy) {
    if (item.user) set.add(item.user)
  }
  return [...set]
})

const sortData = computed(() => {
  return form.value.data.slice().sort((a, b) => {
    // 日期为空时，默认排到最后
    const aDate = a.date ?? '9999-12-31'
    const bDate = b.date ?? '9999-12-31'
    return aDate.localeCompare(bDate)
  })
})

// 计算总金额
const totalAmount = computed(() => calcTotalAmount(form.value.data, form.value.subsidy))

function onSelectFileClick(index: number) {
  refInputFiles.value?.[index].click()
}

async function onImportFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files?.length) return
  const file = target.files[0]
  if (file.type !== 'application/json' || !file.name.endsWith('.json')) {
    return ElMessage.error('请选择json文件')
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const jsonData: IForm = JSON.parse(reader.result as string)
      if (!jsonData.data?.length || !jsonData.subsidy?.length) throw new Error('数据格式不正确')
      form.value = jsonData
    } catch (e: any) {
      ElMessage.error(e.message)
    }
  }
  reader.readAsText(file)
  target.value = null!
}

async function onFileChange(e: Event, index: number) {
  const target = e.target as HTMLInputElement
  const item = form.value.data[index]
  if (!target.files?.length || !item) return
  const file = target.files[0]

  if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
    try {
      loadings.value[index] = true
      const ocrTicket = await api.ocr.ticket(file)
      const canvas = await parseFile(file)
      if (canvas) {
        item.invoice = {
          ocrTicket,
          base64: canvas.toDataURL('image/jpeg', 0.6),
          width: canvas.width,
          height: canvas.height,
        }
      }
      const amount = ocrTicket?.realResult.find((item) => {
        return item.index === EOcrTicketIndex.TOTAL_LOWER
      })
      item.amount = amount?.value ? parseFloat(amount.value.substring(1)) : undefined
      item.remarks = file.name.substring(0, file.name.lastIndexOf('.'))
    } finally {
      loadings.value[index] = false
    }
  } else {
    ElMessage.error('请选择图片或pdf文件')
  }
  target.value = null!
}

function onSubSidyDateChange(item: IData) {
  item.amount = calcSubsidyAmount(item)
  item.remarks = parseSubsidyRemarks(item)
}

async function onCommand(command: 'importJson' | 'exportJson' | 'exportWord') {
  if (command === 'exportWord') {
    if (!form.value.user) return ElMessage.error('请输入出差人')
    if (!form.value.dateRange) return ElMessage.error('请选择出差日期')
    genWord(form.value, sortData.value, form.value.subsidy)
    return
  }

  if (command === 'exportJson' && form.value) {
    const res = await ElMessageBox.prompt('请输入文件名', {
      inputValue: form.value.fileName,
      inputValidator: (value) => {
        if (!value?.trim().length) return '请输入文件名'
        return true
      },
    })
    if (res.action === 'confirm') {
      const content = JSON.stringify(toRaw(form.value), null, 4)
      var blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      FileSaver.saveAs(blob, res.value + '.json')
    }
    return
  }

  if (command === 'importJson') {
    const res = await ElMessageBox.confirm('确认导入数据，并覆盖当前内容吗？')
    if (res === 'confirm') {
      refImportInputFile.value?.click()
    }
    return
  }
}

watch([() => form.value.user, () => form.value.dateRange, () => form.value.location], () => {
  const { user, dateRange, location } = form.value
  if (user?.length && dateRange?.length && location) {
    form.value.fileName = `${user.join('、')}${location}出差支出说明-${dayjs(dateRange[0]).format('YYYYMMDD')}`
  }
})
</script>

<style lang="scss" scoped>
.index {
  padding: 10px;

  .el-button {
    + .el-button {
      margin-left: 5px;
    }
  }

  .flex {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    background-color: #e6e8eb;
    padding: 10px;
    border-radius: 5px;

    .el-form-item {
      margin-bottom: 0;
    }
  }

  .tips {
    color: #e6a23c;
    padding: 10px 0;
    font-size: 14px;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    :deep(.el-date-editor) {
      width: auto;
    }

    .el-button {
      &.is-text {
        padding: 0;
        height: auto;
      }
    }

    .el-input-number {
      width: 100%;
    }

    td {
      padding: 5px 10px;
      border: 1px solid var(--el-border-color);
      vertical-align: middle;

      &.center {
        text-align: center;
      }
    }
  }

  .tip {
    padding: 10px 0;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    .label {
      margin-bottom: 10px;
    }
    .el-image {
      width: 400px;
    }
  }
}
</style>
