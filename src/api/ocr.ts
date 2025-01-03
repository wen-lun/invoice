import axios from 'axios'

export interface IOcrResult<T> {
  flag: boolean
  code: number
  desc: string
  data: T
}

export interface IOcrTicketData {
  realResult: Array<{
    index: string
    remark: string
    name: string
    ExportName: string
    value: string
  }>
  resultUrl: string
}

export enum EOcrTicketIndex {
  /**价税合计小写 */
  TOTAL_LOWER = '12',
}

// 讯飞开放平台[增值税发票识别] https://www.xfyun.cn/services/vat_invoice
const request = axios.create({
  baseURL: 'https://iocr.xfyun.cn/athena',
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
  },
})

async function upload(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const result = await request
    .post<IOcrResult<string>>('/s3/upload', formData)
    .then((res) => res.data)
  if (result.code === 0) return result.data
}

export async function ticket(file: File) {
  const fileUrl = await upload(file)

  if (!fileUrl) return

  const data = {
    url: fileUrl,
    type: 'vat_invoice',
    defaultFlag: 0,
  }
  const result = await request
    .post<IOcrResult<IOcrTicketData>>('/u/api/ticket', data, {
      headers: { 'content-type': 'application/json' },
    })
    .then((res) => res.data)
  if (result.code === 0) return result.data
}
