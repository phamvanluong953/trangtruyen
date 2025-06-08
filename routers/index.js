var express = require('express');
var router = express.Router();
var firstImage = require('../modules/firstimage');
var TheLoai = require('../models/theloai');
var Novel = require('../models/novel');
var Chuong = require('../models/chuong');

// GET: Trang chủ
router.get('/', async (req, res) => {
	var tl = await TheLoai.find();
	var tr = await Novel.find({KiemDuyet:1})
		.populate('TheLoai')
		.populate('TaiKhoan')
		.sort({NgayDang:'desc'}).exec();
	res.render('home',{
		title:'Trang chủ',
		theloai: tl,
		novel: tr,
		firstImage: firstImage
	});
});

// GET: Lọc
router.get('/loc/:id', async (req, res) => {
	var id = req.params.id;
	var tl = await TheLoai.find();
	var tr = await Novel.find({KiemDuyet:1, TheLoai: id})
		.populate('TheLoai')
		.populate('TaiKhoan')
		.sort({NgayDang:'desc'}).exec();
	res.render('loc',{
		title:'Các truyện cùng thể loại',
		theloai: tl,
		novel: tr,
		firstImage: firstImage
	});
});


router.get('/novel/chitiet/:id', async function(req, res){
    var id = req.params.id;

    if (!req.session.viewedNovels) {
        req.session.viewedNovels = [];
    }

    // Nếu chưa xem truyện này thì tăng lượt xem
    if (!req.session.viewedNovels.includes(id)) {
        await Novel.updateOne({ _id: id }, { $inc: { LuotXem: 1 } });
        req.session.viewedNovels.push(id);
    }

    var tr = await Novel.findById(id)
        .populate('TheLoai')
        .populate('TaiKhoan')
        .exec();

    var ch = await Chuong.find({ Novel: id })
        .sort({ createdAt: 1 }); // Sắp xếp chương tăng dần

    res.render('novel_chitiet',{
        novel: tr,
        chuong: ch
    });
});

// GET: Xem chuong
router.get('/chuong/chitiet/:id', async function(req, res){
	var id = req.params.id;
	var ch = await Chuong.findById(id)
		.populate('Novel')
		.populate('TaiKhoan').exec();
	var prevChapter = await Chuong.findOne({ Novel: ch.Novel, _id: { $lt: ch._id }, KiemDuyet: 1 })
		.sort({ _id: -1 })
		.exec();
	var nextChapter = await Chuong.findOne({ Novel: ch.Novel, _id: { $gt: ch._id },KiemDuyet: 1 })
		.sort({ _id: 1 })
		.exec();
	var allChapters = await Chuong.find({ Novel: ch.Novel,KiemDuyet: 1 })
		.sort({ _id: 1 })
		.exec();
	res.render('chuong_chitiet',{
		chuong:ch,
		prevChap:prevChapter,
		nextChap:nextChapter,
		allChap:allChapters
	});
});

// GET: Kết quả tìm kiếm
router.get('/timkiem', async function(req, res){
    var tukhoa = req.query.tukhoa;

    if(!tukhoa || tukhoa.trim() === '') {
        // Nếu không có từ khóa hoặc chuỗi trắng thì chuyển về trang chủ
        return res.redirect('/');
    }

    var dsTheLoai = await TheLoai.find();
    var ketqua = await Novel.find({
        KiemDuyet: 1,
        TieuDe: { $regex: new RegExp(tukhoa, 'i') }
    })
    .populate('TheLoai')
    .populate('TaiKhoan')
    .sort({ NgayDang: 'desc' })
    .exec();

    res.render('timkiem', {
        title: 'Kết quả tìm kiếm',
        truyens: ketqua,
        theloai: dsTheLoai
    });
});

router.get('/tinmoinhat', async function(req, res) {
    var topNovels = await Novel.find({ KiemDuyet: 1 })
        .populate('TheLoai')
        .sort({ LuotXem: -1 })
        .limit(10)
        .exec();

    var theloai = await TheLoai.find();

    res.render('tinmoinhat', {
        title: 'Tin mới nhất',
        topNovels: topNovels,
        theloai: theloai
    });
});



// GET: Lỗi
router.get('/error', async (req, res) => {
	res.render('error', {
		title: 'Lỗi'
	});
});

// GET: Thành công
router.get('/success', async (req, res) => {
	res.render('success', {
		title: 'Hoàn thành'
	});
});

module.exports = router;