var express = require("express");
var router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

var TheLoai = require("../models/theloai");
var Novel = require("../models/novel");
var Chuong = require("../models/chuong"); // thêm model chương

// Tạo thư mục nếu chưa tồn tại
const uploadDir = path.join(__dirname, "..", "public", "images", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Hàm tạo số random đơn giản, đảm bảo là số nguyên và khác nhau mỗi lần gọi
function generateRandomNumber() {
  return Math.floor(Math.random() * 1e9); // số nguyên từ 0 đến gần 1 tỷ
}

// Cấu hình lưu trữ ảnh bằng multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, uploadDir);
    } else {
      cb(new Error("Chỉ cho phép file hình ảnh jpg, png, webp"), false);
    }
  },
  filename: function (req, file, cb) {
    const randomNumber = generateRandomNumber();
    const extension = file.mimetype.split("/")[1];
    const fileName = randomNumber + "." + extension;
    cb(null, fileName);
  },
});
var upload = multer({ storage: storage });

// GET: Danh sách bài viết
router.get("/", async function (req, res) {
  var tr = await Novel.find().populate("TheLoai").populate("TaiKhoan").exec();

  // Lặp qua từng truyện để tính số chương đã duyệt
  for (let item of tr) {
    let soChuong = await Chuong.countDocuments({
      Novel: item._id,
      KiemDuyet: 1, // chỉ đếm chương đã duyệt
    });
    item.SoChuong = soChuong;
  }

  // Sắp xếp: truyện chưa duyệt (KiemDuyet != 1) lên đầu
  tr.sort((a, b) => {
    return (a.KiemDuyet === 1 ? 1 : 0) - (b.KiemDuyet === 1 ? 1 : 0);
  });

  res.render("novel", {
    title: "Danh sách truyện",
    novel: tr,
  });
});

// GET: Đăng bài viết
router.get("/them", async function (req, res) {
  var tl = await TheLoai.find();
  res.render("novel_them", {
    title: "Đăng truyện",
    theloai: tl,
  });
});

// POST: Đăng bài viết
router.post("/them", upload.single("HinhAnh"), async function (req, res, next) {
  var kd = 0;
  if (req.session.MaNguoiDung) {
    const file = req.file;
    if (!file) {
      const error = new Error("Hãy upload hình ảnh");
      res.redirect("/error");
      return;
    }
    if (req.session.QuyenHan === "admin") {
      kd = 1;
    }
    const picURL = "/images/uploads/" + file.filename;
    var data = {
      TheLoai: req.body.MaTheLoai,
      TaiKhoan: req.session.MaNguoiDung,
      TieuDe: req.body.TieuDe,
      TomTat: req.body.TomTat,
      KiemDuyet: kd,
      HinhAnh: picURL,
    };
    await Novel.create(data);
    req.session.success = "Đã đăng bài viết thành công và đang chờ kiểm duyệt.";
    res.redirect("/success");
  } else {
    res.redirect("/dangnhap");
  }
});

// GET: Sửa bài viết
router.get("/sua/:id", async function (req, res) {
  var id = req.params.id;
  var tl = await TheLoai.find();
  var tr = await Novel.findById(id);
  res.render("novel_sua", {
    title: "Chỉnh sửa truyện",
    theloai: tl,
    novel: tr,
  });
});

// POST: Sửa bài viết
router.post(
  "/sua/:id",
  upload.single("HinhAnh"),
  async function (req, res, next) {
    var id = req.params.id;
    const file = req.file;
    if (!file) {
      const error = new Error("Hãy upload hình ảnh");
      res.redirect("/error");
      return;
    }
    const picURL = "/images/uploads/" + file.filename;
    var data = {
      TheLoai: req.body.MaTheLoai,
      TieuDe: req.body.TieuDe,
      TomTat: req.body.TomTat,
      HinhAnh: picURL,
    };
    await Novel.findByIdAndUpdate(id, data);
    req.session.success =
      "Đã cập nhật bài viết thành công và đang chờ kiểm duyệt.";
    res.redirect("/success");
  }
);

// GET: Duyệt bài viết
router.get("/duyet/:id", async function (req, res) {
  var id = req.params.id;
  var tr = await Novel.findById(id);
  await Novel.findByIdAndUpdate(id, { KiemDuyet: 1 - tr.KiemDuyet });
  res.redirect("back");
});

// GET: Xóa bài viết
router.get("/xoa/:id", async function (req, res) {
  var id = req.params.id;
  await Novel.findByIdAndDelete(id);
  res.redirect("back");
});

// GET: Danh sách bài viết của tôi
router.get("/cuatoi", async function (req, res) {
  if (req.session.MaNguoiDung) {
    var id = req.session.MaNguoiDung;
    var tr = await Novel.find()
      .populate("TheLoai", "tentheloai")
      .populate("TaiKhoan")
      .exec();
    res.render("novel_cuatoi", {
      title: "Truyện của tôi",
      novel: tr,
    });
  } else {
    res.redirect("/dangnhap");
  }
});

module.exports = router;
