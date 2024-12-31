export interface IData {
  /** 项目 */
  type?: string
  /** 日期 */
  date?: string
  /** 日期范围 */
  dateRange?: string[]
  /** 金额 */
  amount?: number
  /** 经手人 */
  user?: string
  /** 备注 */
  remarks?: string
  /**发票 */
  invoice?: {
    base64: string
    width: number
    height: number
  }
}

export interface IForm {
  /** 文件名 */
  fileName?: string
  /** 出差地点 */
  location?: string
  /** 出差人 */
  user?: string[]
  /** 日期范围 */
  dateRange?: string[]
  /** 项目 */
  data: IData[]
  /** 补贴 */
  subsidy: IData[]
}
