var express = require('express');
var router = express.Router();
var TheLoai = require('../models/theloai');

// GET: Danh sách chủ đề
router.get('/', async (req, res) => {
	var tl = await TheLoai.find();
	res.render('theloai', {
		title: 'Danh sách thể loại',
		theloai: tl
	});
});
// GET: Thêm chủ đề
router.get('/them', async (req, res) => {
	res.render('theloai_them', {
		title: 'Thêm thể loại'
	});
});

// POST: Thêm chủ đề
router.post('/them', async (req, res) => {
    try {
        const tenTheLoai = req.body.TenTheLoai;
        // Kiểm tra xem tên thể loại đã tồn tại chưa
        const existingTheLoai = await TheLoai.findOne({ tentheloai: tenTheLoai });
        
        if (existingTheLoai) {
            // Nếu tên thể loại đã tồn tại
            res.render('theloai_them', {
                title: 'Thêm thể loại',
                thongbao: 'Tên thể loại đã tồn tại!',
                alertType: 'danger'
            });
        } else {
            // Nếu tên thể loại chưa tồn tại, tiến hành thêm mới
            var data = {
                tentheloai: tenTheLoai
            };
            await TheLoai.create(data);
            // Chuyển hướng về danh sách thể loại sau khi thêm thành công
            res.redirect('/theloai');
        }
    } catch (error) {
        res.render('theloai_them', {
            title: 'Thêm thể loại',
            thongbao: 'Đã có lỗi xảy ra khi thêm thể loại!',
            alertType: 'danger'
        });
    }
});

// GET: Sửa chủ đề
router.get('/sua/:id', async (req, res) => {
	var id = req.params.id;
	var tl = await TheLoai.findById(id);
	res.render('theloai_sua', {
		title: 'Sửa thể loại',
		theloai: tl
	});
});

// POST: Sửa chủ đề
router.post('/sua/:id', async (req, res) => {
	var id = req.params.id;
	var data = {
		tentheloai: req.body.TenTheLoai
	};
	await TheLoai.findByIdAndUpdate(id, data);
	res.redirect('/theloai');
});

// GET: Xóa chủ đề
router.get('/xoa/:id', async function(req, res){	
	var id = req.params.id;
	await TheLoai.findByIdAndDelete(id);
	res.redirect('/theloai');
});

module.exports = router;