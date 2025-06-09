var express = require("express");
var router = express.Router();
var bcrypt = require("bcryptjs");
var saltRounds = 10;
var TaiKhoan = require("../models/taikhoan");
var sendMail = require("../utils/sendMail");
const crypto = require("crypto"); // thêm import crypto
var multer = require("multer");
var path = require("path");

// Cấu hình lưu ảnh
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // <-- sửa thành thư mục bạn mong muốn
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
var upload = multer({ storage: storage });

// GET: Đăng ký
router.get("/dangky", (req, res) => {
  res.render("dangky", {
    title: "Đăng ký tài khoản",
    formData: req.session.formData || {},
  });
  req.session.formData = null; // xóa formData sau khi dùng
});

router.post("/dangky", upload.single("HinhAnh"), async (req, res) => {
  try {
    const { HoVaTen, Email, TenDangNhap, MatKhau, XacNhanMatKhau } = req.body;
    const HinhAnh = req.file ? req.file.filename : null;
    let errors = {};

    if (!Email || !Email.match(/^[\w.-]+@gmail\.com$/))
      errors.Email = "Email phải có định dạng và kết thúc bằng @gmail.com.";
    if (!HoVaTen) errors.HoVaTen = "Họ và tên là bắt buộc.";
    if (!TenDangNhap) errors.TenDangNhap = "Tên đăng nhập là bắt buộc.";
    if (!MatKhau) errors.MatKhau = "Mật khẩu là bắt buộc.";
    if (MatKhau !== XacNhanMatKhau)
      errors.XacNhanMatKhau = "Mật khẩu và xác nhận mật khẩu không khớp.";

    if (Object.keys(errors).length > 0) {
      req.session.error = JSON.stringify(errors);
      req.session.formData = req.body;
      return res.redirect("/dangky");
    }

    // Kiểm tra tên đăng nhập tồn tại
    const existing = await TaiKhoan.findOne({ TenDangNhap });
    if (existing) {
      req.session.error = "Tên đăng nhập đã tồn tại.";
      req.session.formData = req.body;
      return res.redirect("/auth/dangky");
    }

    // Nếu bạn muốn kiểm tra thêm trùng Email, cũng có thể check tương tự:
    const emailExists = await TaiKhoan.findOne({ Email });
    if (emailExists) {
      req.session.error = "Email đã được đăng ký.";
      req.session.formData = req.body;
      return res.redirect("/auth/dangky");
    }

    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(MatKhau, saltRounds);

    const data = {
      HoVaTen,
      Email,
      HinhAnh,
      TenDangNhap,
      MatKhau: hashedPassword,
    };

    await TaiKhoan.create(data);

    const htmlContent = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h3>👋 Xin chào ${HoVaTen},</h3>
    <p>Bạn đã đăng ký tài khoản thành công trên hệ thống KICKBACK.</p>
    
    <p>
      <span style="font-size: 16px;"><strong>Tên đăng nhập:</strong> ${TenDangNhap}</span><br/>
      <span style="font-size: 16px;"><strong>Mật khẩu:</strong> ${MatKhau}</span>
    </p>

    <p>📌 Vui lòng giữ bí mật thông tin này và không chia sẻ với người khác.</p>

    <p>
      🌐 Bạn có thể truy cập hệ thống tại: <br/>
      <a href="https://trangtruyenkickback.onrender.com" target="_blank"
         style="color: #e2852f; text-decoration: none; font-weight: bold;">
        👉 https://trangtruyenkickback.onrender.com
      </a>
    </p>

    <hr style="border: none; border-top: 1px solid #ddd;" />
    <p style="font-size: 13px; color: #888;">📮 Đây là email tự động, vui lòng không trả lời.</p>
  </div>
`;

    await sendMail(Email, "Thông tin tài khoản đăng nhập", htmlContent);

    req.session.success =
      "Đã đăng ký tài khoản thành công. Vui lòng kiểm tra email.";
    req.session.formData = null; // <-- Dòng thêm
    req.session.error = null; // <-- Dòng thêm
    res.redirect("/auth/dangky");
  } catch (error) {
    console.error("Lỗi đăng ký:", error);

    if (error.code === 11000) {
      // Lấy trường bị trùng trong error.message
      let field = Object.keys(error.keyPattern)[0]; // ví dụ: TenDangNhap hoặc Email
      req.session.error = `Giá trị ${field} đã tồn tại, vui lòng chọn giá trị khác.`;
    } else {
      req.session.error = "Có lỗi xảy ra khi đăng ký tài khoản.";
    }

    req.session.formData = req.body;
    res.redirect("/auth/dangky");
  }
});

// GET: Đăng nhập
router.get("/dangnhap", async (req, res) => {
  res.render("dangnhap", {
    title: "Đăng nhập",
  });
});

// POST: Đăng nhập
router.post("/dangnhap", async (req, res) => {
  if (req.session.MaNguoiDung) {
    req.session.error = "Người dùng đã đăng nhập rồi.";
    res.redirect("/error");
  } else {
    var taikhoan = await TaiKhoan.findOne({
      TenDangNhap: req.body.TenDangNhap,
    }).exec();
    if (taikhoan) {
      if (bcrypt.compareSync(req.body.MatKhau, taikhoan.MatKhau)) {
        if (taikhoan.KichHoat == 0) {
          req.session.error = "Người dùng đã bị khóa tài khoản.";
          res.redirect("/error");
        } else {
          // Đăng ký session
          req.session.MaNguoiDung = taikhoan._id;
          req.session.HoVaTen = taikhoan.HoVaTen;
          req.session.QuyenHan = taikhoan.QuyenHan;

          res.redirect("/");
        }
      } else {
        req.session.error = "Mật khẩu không đúng.";
        res.redirect("/error");
      }
    } else {
      req.session.error = "Tên đăng nhập không tồn tại.";
      res.redirect("/error");
    }
  }
});

// GET: Đăng xuất
router.get("/dangxuat", async (req, res) => {
  if (req.session.MaNguoiDung) {
    delete req.session.MaNguoiDung;
    delete req.session.HoVaTen;
    delete req.session.QuyenHan;

    res.redirect("/");
  } else {
    req.session.error = "Người dùng chưa đăng nhập.";
    res.redirect("/error");
  }
});

//GET
router.get("/quenmatkhau", (req, res) => {
  res.render("quenmatkhau", {
    title: "Quên Mật Khẩu",
    error: null,
    success: null
  });
});

router.post("/quenmatkhau", async (req, res) => {
  const email = req.body.Email;
  try {
    const taiKhoan = await TaiKhoan.findOne({ Email: email });

    if (!taiKhoan) {
      return res.render("quenmatkhau", {
        title: "Quên Mật Khẩu",
        error: "Email không tồn tại trong hệ thống.",
        success: null,
      });
    }

    const newPassword = crypto.randomBytes(4).toString("hex");
    const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);
    taiKhoan.MatKhau = hashedPassword;
    await taiKhoan.save();

    const htmlContent = `
      <h3>Xin chào ${taiKhoan.HoVaTen},</h3>
      <p>Bạn đã yêu cầu khôi phục mật khẩu.</p>
      <p><b>Tên đăng nhập:</b> ${taiKhoan.TenDangNhap}</p>
      <p><b>Mật khẩu mới:</b> ${newPassword}</p>
      <p>Vui lòng đăng nhập và thay đổi mật khẩu sau khi đăng nhập.</p>
    `;

    await sendMail(email, "Mật khẩu mới từ hệ thống", htmlContent);

    return res.render("quenmatkhau", {
      title: "Quên Mật Khẩu",
      success: "Mật khẩu mới đã được gửi vào email của bạn.",
      error: null,
    });
  } catch (err) {
    console.error("Lỗi gửi mail:", err);
    return res.render("quenmatkhau", {
      title: "Quên Mật Khẩu",
      error: "Có lỗi xảy ra khi gửi email. Vui lòng thử lại.",
      success: null,
    });
  }
});

router.get("/dangxuat", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.clearCookie("connect.sid");
    res.redirect("/auth/dangnhap");
  });
});

module.exports = router;
