export const enum DefaultPermissions {
  Blacklisted = -1,
  User,
  Moderator,
  Administrator,
  Owner,
  // The range that users can assign a permission group to is 1-250.
  // Discord allows a server to have a maximum of 250 roles.
  // The permissions of the roles cascade in a descending
  // manner based on the highest permission one has.
  // There is allowed to be only one number permission group.
  Developer = 251,
}
