var _ = require('lodash');

var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');

var postModel = require('../models/post');

var socialSchema = new mongoose.Schema({
    type: String,
    id: String
});

var profileSchema = new mongoose.Schema({
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    name: String,
    avatar: String,
    social: [socialSchema],
    locale: { type: String, default: 'en-us' }
});

profileSchema.plugin(findOrCreate);

profileSchema.statics.createProfile = function (type, data, callback) {

    this.findOrCreate(
        { 'social.type': type, 'social.id': data.id },
        {
            name: data.name,
            avatar: data.avatar,
            social: [ { type: type, id: data.id } ]
        },
        { upsert: true },
        callback
    );

};

profileSchema.statics.updateProfile = function (profileId, data, callback) {

    this.findById(profileId)
        .exec(function (err, profile) {

            if (data.locale) {

                profile.locale = data.locale;

            }

            profile.save(callback);

        });

};

profileSchema.statics.showProfileById = function (profileId, callback) {

    this.findById(profileId)
        .lean()
        .exec(function (err, profile) {

            if (err || !profile) {

                callback(err, profile);

            } else {

                postModel.find({ createdBy: profileId })
                    .populate('createdBy')
                    .sort({ createdAt: -1 })
                    .select('createdAt updatedAt views title slug contents messageCount createdBy')
                    .exec(function (err, posts) {

                        callback(err, _.assign(profile, { posts: posts }));

                    });

            }

        });
};

profileSchema.pre('save', function (next) {

    this.updatedAt = Date.now();

    next();

});

module.exports = mongoose.model('profile', profileSchema);
