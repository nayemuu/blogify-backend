const checkPermission = async (permission) => {
  let userPermissionsList = [];
  let isSuperUser = true;

  return async (req, res, next) => {
    if (isSuperUser) {
      next();
    }

    if (!userPermissionsList.includes(permission)) {
      throw new AppError("Forbidden", 403);
    }
    next();
  };
};
