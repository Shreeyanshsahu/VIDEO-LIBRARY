// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next);
//     } catch (error) {
//         console.error(error); 

//         res.status(error.statusCode || 500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// export { asyncHandler };
const asyncHandler = (func) => (req, res, next) =>
    Promise.resolve(func(req, res, next)).catch(next);

export { asyncHandler };