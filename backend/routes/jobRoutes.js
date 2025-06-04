// 收藏职位
router.post('/:id/favorite', authController.protect, jobController.toggleFavorite); 