var mongoose = require('mongoose');

const novel_theLoaiSchema = new mongoose.Schema({
	novel: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel' },
    TheLoai: { type: mongoose.Schema.Types.ObjectId, ref: 'TheLoai' }
});

var novel_theLoaiModel = mongoose.model('Novel_TheLoai', novel_theLoaiSchema);

module.exports = novel_theLoaiModel;