export const scrollToBottom = () => {
  window.scrollTo({
    left: 0,
    top: document.documentElement.scrollHeight,
    behavior: 'smooth' // Optional: defines smooth scrolling
  })
}
