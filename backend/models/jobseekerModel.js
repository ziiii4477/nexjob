skills: [{
    type: String,
    trim: true
}],
favoriteJobs: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Job'
}], 