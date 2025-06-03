import Models from '@api/models'

/**
 * Look up a user by e-mail (case-insensitive).
 */
export const findByEmail = (email: string) =>
  Models.User.findOne({
    where: { email: email.toLowerCase() }
  })

export const findAll = async () => {
  const users = await Models.User.findAll()

  const formatted = users.map(({ uuid, first_name, last_name }) => ({
    uuid,
    first_name,
    last_name
  }))

  return formatted
}

/* keep file as a module for --isolatedModules */
export {}
