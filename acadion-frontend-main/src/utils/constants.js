export const ROLES = {
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT',
};

export const GROUP_STATUS = {
  DRAFT: 'draft',
  READY: 'ready',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const INVITATION_STATE = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

export const WORKSHEET_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  COMPLETED_LATE: 'completed_late',
  NOT_COMPLETED: 'not_completed',
};

export const RULE_CRITERIA = {
  GROUP_SIZE: 'GROUP_SIZE',
  USER_ATTRIBUTE_COUNT: 'USER_ATTRIBUTE_COUNT',
  SAME_USER_ATTRIBUTE: 'SAME_USER_ATTRIBUTE',
};

export const OPERATORS = {
  EQUAL_TO: 'EQUAL_TO',
  AT_MOST: 'AT_MOST',
  AT_LEAST: 'AT_LEAST',
};

export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  ready: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  pending: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  completed_late: 'bg-orange-100 text-orange-800',
  not_completed: 'bg-red-100 text-red-800',
};