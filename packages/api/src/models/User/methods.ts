import Models from '@api/models'

/**
 * Look up a user by e-mail (case-insensitive).
 */
export const findByEmail = (email: string) =>
  Models.User.findOne({
    where: { email: email.toLowerCase() }
  })

/* keep file as a module for --isolatedModules */
export {}
