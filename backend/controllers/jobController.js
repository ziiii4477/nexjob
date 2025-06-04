exports.toggleFavorite = async (req, res) => {
    try {
        const jobId = req.params.id;
        const jobseekerId = req.user.id;

        // 获取求职者信息
        const jobseeker = await JobSeeker.findById(jobseekerId);
        if (!jobseeker) {
            return res.status(404).json({
                status: 'fail',
                error: '未找到求职者信息'
            });
        }

        // 检查职位是否存在
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                status: 'fail',
                error: '未找到该职位'
            });
        }

        // 检查职位是否已在收藏列表中
        const favoriteIndex = jobseeker.favoriteJobs.indexOf(jobId);
        let isFavorited = false;

        if (favoriteIndex === -1) {
            // 添加到收藏
            jobseeker.favoriteJobs.push(jobId);
            isFavorited = true;
        } else {
            // 取消收藏
            jobseeker.favoriteJobs.splice(favoriteIndex, 1);
            isFavorited = false;
        }

        await jobseeker.save();

        res.status(200).json({
            status: 'success',
            data: {
                isFavorited
            }
        });
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({
            status: 'error',
            error: '操作失败，请稍后重试'
        });
    }
}; 