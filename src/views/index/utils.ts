import dayjs from 'dayjs'
import type { IData, IForm } from './typing'
import * as pdfjsLib from 'pdfjs-dist'
import {
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  XmlComponent,
  type ITableCellOptions,
} from 'docx'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// 每日补贴金额
const DAILY_SUBSIDY_AMOUNT = 50

// 计算出差天数
export function calcTravelDays(item: IData) {
  const [start, end] = item.dateRange || []
  if (!start || !end) return 0

  const startDate = dayjs(start)
  const endDate = dayjs(end)
  return endDate.diff(startDate, 'day') + 1
}

export function parseSubsidyRemarks(item: IData) {
  const [start, end] = item.dateRange || []
  if (!start || !end) return
  const format = 'MM-DD'
  return `从${dayjs(start).format(format)}至${dayjs(end).format(format)} (共${calcTravelDays(item)}天)`
}

export function calcSubsidyAmount(item: IData) {
  return calcTravelDays(item) * DAILY_SUBSIDY_AMOUNT
}

// 处理图片文件
async function image2canvas(file: File) {
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d', {
        alpha: false,
        willReadFrequently: true,
      })

      if (!ctx) {
        reject(new Error('无法获取 canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(img.src) // 释放内存
      resolve(canvas)
    }

    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

async function pdf2canvas(file: File) {
  const pdfDoc = await pdfjsLib.getDocument({
    data: await file.arrayBuffer(),
    cMapPacked: true, // 使用打包的 cMap
    cMapUrl: '/cmaps/', // 添加 cMap 文件路径
    standardFontDataUrl: '/standard_fonts/', // 标准字体数据路径
    fontExtraProperties: true, // 启用字体回退机制
    useSystemFonts: true, // 允许使用系统字体
  }).promise
  const page = await pdfDoc.getPage(1)

  const viewport = page.getViewport({ scale: 2 })

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  canvas.width = viewport.width
  canvas.height = viewport.height

  // 渲染 PDF 页面到 canvas
  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise

  return canvas
}

export function parseFile(file: File) {
  if (file.type.startsWith('image/')) {
    return image2canvas(file)
  }
  if (file.type === 'application/pdf') {
    return pdf2canvas(file)
  }
}

export function calcTotalAmount(data: IData[], subsidy: IData[]) {
  return [...data, ...subsidy].reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)
}

export function genWord(form: IForm, data: IData[], subsidy: IData[]) {
  // 创建单元格的通用样式
  const createCell = (text: string, options: Partial<ITableCellOptions> = {}, isBlob = false) => {
    return new TableCell({
      margins: {
        top: 20, // 上内边距
        bottom: 20, // 下内边距
        left: 100, // 左内边距
        right: 100, // 右内边距
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold: isBlob })],
        }),
      ],
      ...options,
    })
  }

  // 创建表头行
  const headerRow = new TableRow({
    children: [
      createCell('序号', {}, true),
      createCell('项目', {}, true),
      createCell('日期', {}, true),
      createCell('金额', {}, true),
      createCell('经手人', {}, true),
      createCell('备注', {}, true),
    ],
  })

  // 创建项目数据行
  const projectRows = data.map(
    (item, index) =>
      new TableRow({
        children: [
          createCell(`${index + 1}`),
          createCell(item.type || ''),
          createCell(item.date || ''),
          createCell(`${item.amount || ''}`),
          createCell(item.user || ''),
          createCell(item.remarks || ''),
        ],
      }),
  )

  // 创建补贴数据行
  const subsidyRows = subsidy
    .filter((item) => item.dateRange && item.amount)
    .map(
      (item) =>
        new TableRow({
          children: [
            createCell(''),
            createCell(item.type || ''),
            createCell(`${calcTravelDays(item)}天*${DAILY_SUBSIDY_AMOUNT}元/天`),
            createCell(`${item.amount || ''}`),
            createCell(item.user || ''),
            createCell(item.remarks || ''),
          ],
        }),
    )

  // 创建总计行
  const totalAmount = calcTotalAmount(data, subsidy)

  const totalRow = new TableRow({
    children: [
      createCell(''),
      createCell('以上总计', {}, true),
      createCell(''),
      createCell(totalAmount, {}, true),
      createCell(''),
      createCell(''),
    ],
  })

  // 创建表格
  const table = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    columnWidths: [1000, 2000, 2000, 1500, 1500, 3000], // 设置列宽
    rows: [headerRow, ...projectRows, ...subsidyRows, totalRow],
  })

  // 创建文档
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: 'center',
            spacing: {
              before: 100, // 段前距离
              after: 100, // 段后距离
            },
            children: [new TextRun({ text: '出差支出说明', size: 30 })],
          }),
          new Paragraph({
            text: `本次出差人${form.user?.join('、')}，日期${form.dateRange?.join('至')}，旅途中费用详情如下表：`,
          }),
          table,
          new Paragraph({}),
          new Paragraph({ text: '发票凭证如下：' }),
          ...data
            .map((item, i) => {
              const components = [
                new Paragraph({
                  spacing: {
                    before: 100, // 段前距离
                    after: 100, // 段后距离
                  },
                  text: `${i + 1}、${item.remarks || ''}`,
                }),
              ]
              if (item.invoice) {
                // 获取原始图片尺寸
                const originalWidth = item.invoice.width
                const originalHeight = item.invoice.height

                const targetWidth = 500

                // 计算等比例的高度
                const targetHeight = Math.round(targetWidth * (originalHeight / originalWidth))
                components.push(
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: item.invoice.base64,
                        type: 'jpg',
                        transformation: { width: targetWidth, height: targetHeight },
                      }),
                    ],
                  }),
                )
              }
              return components
            })
            .flat(),
        ],
      },
    ],
  })

  // 导出文档
  Packer.toBlob(doc).then((blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.fileName}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  })
}
