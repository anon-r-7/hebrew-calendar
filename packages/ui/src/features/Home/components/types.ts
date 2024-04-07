export interface Form {
  age?: number
  riskTolerance: string
  debtOverFivePercent: boolean
  income: number
  debt: number
  assets: number
  disposableMonthlyIncome: number
  hasRetirement: boolean
  hasTraditionalIra: boolean
  hasRothIra: boolean
  hasGeneral: boolean
  retirement: number
  traditionalIra: number
  rothIra: number
  general: number
}

export interface Chat {
  message: string
  type: string // 'user' or 'bot'
}

export interface InitialState {
  formDisplay: boolean
  formValid: boolean
  form: Form
  question: string
  submitCount: number
  chat: Chat[]
  isBotTyping: boolean
}

export const initialState: InitialState = {
  formDisplay: true,
  formValid: false,
  question: '',
  submitCount: 0,
  isBotTyping: false,
  chat: [
    {
      message:
        'I am a chatbot representing alooola, a financial robo-advisor mobile app. I combine modern technology and expert advisors to help users achieve their long-term wealth goals. How can I assist you today?',
      type: 'bot'
    }
  ],
  form: {
    age: null,
    riskTolerance: '',
    debtOverFivePercent: false,
    income: 0,
    debt: 0,
    assets: 0,
    disposableMonthlyIncome: 0,
    hasRetirement: false,
    hasTraditionalIra: false,
    hasRothIra: false,
    hasGeneral: false,
    retirement: 0,
    traditionalIra: 0,
    rothIra: 0,
    general: 0
  }
}
