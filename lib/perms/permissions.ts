export const enum DefaultPermissions {
  Blacklisted = -1,
  User,
  Moderator,
  Administrator,
  Owner,
  // The range that users can assign a permission group to is 1-100.
  // There is allowed to be only one number permission group.
  Developer = 101,
}
