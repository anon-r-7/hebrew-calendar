import { questions } from '@ui/api'

export const askQuestion = async ({ payload, asyncManager, store }) => {
  const chat = store.state.chat
  chat.push({
    message: payload.question,
    type: 'user'
  })
  store.update({
    chat,
    isBotTyping: true
  })

  try {
    asyncManager.start()

    const answer = await questions.create(payload)

    asyncManager.success()

    chat.push({
      message: answer?.data?.answer,
      type: 'bot'
    })

    store.update({
      chat,
      isBotTyping: false
    })
    asyncManager.success()
  } catch (error) {
    chat.push({
      message:
        'Sorry, we had a problem getting a response to your question. Try again later.',
      type: 'bot'
    })
    store.update({
      isBotTyping: false,
      chat
    })
    asyncManager.fail(`Could not get answer`)
  }
}
