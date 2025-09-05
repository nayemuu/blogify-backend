// export const checkPermission = async (permission) => {
//   let userPermissionsList = [];
//   let isSuperUser = true;

//   return async (req, res, next) => {
//     console.log("req.user = ", req.user);
//     if (isSuperUser) {
//       next();
//     }

//     if (!userPermissionsList.includes(permission)) {
//       throw new AppError("Forbidden", 403);
//     }
//     next();
//   };
// };

export const checkPermission = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
