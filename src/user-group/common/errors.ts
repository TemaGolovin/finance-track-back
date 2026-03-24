export const USER_GROUP_ERRORS = {
  USER_GROUP_NOT_FOUND: () => 'User group not found',
  FORBIDDEN_DELETE: () => 'Forbidden to delete this group',
  FORBIDDEN_REMOVE_MEMBER: () => 'Only the group creator can remove members',
  CANNOT_REMOVE_CREATOR: () => 'Cannot remove the group creator',
  FORBIDDEN_MANAGE_CATEGORIES: () => 'Only the group creator can manage group categories',
  GROUP_CATEGORY_NOT_FOUND: (id: string) => `Group category with id ${id} not found`,
};
