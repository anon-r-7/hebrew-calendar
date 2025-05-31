const bcrypt = require('bcrypt')

const init = async () => {
	const password1 = ''
	const hashedPassword1 = await bcrypt.hash(password1, 10)
	const passwordMatch1 = await bcrypt.compare(password1, hashedPassword1)

	const password2 = ''
	const hashedPassword2 = await bcrypt.hash(password2, 10)
	const passwordMatch2 = await bcrypt.compare(password2, hashedPassword2)

	console.log(JSON.stringify({
		password1,
		password2,
		hashedPassword1,
		hashedPassword2,
		passwordMatch1,
		passwordMatch2,
	},null,2))
}

init()
