// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // مجلد الملفات الثابتة
app.use('/uploads', express.static('uploads')); // مجلد رفع الصور

// إنشاء مجلد uploads إذا لم يكن موجوداً
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// إعداد Multer لرفع الصور
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // حفظ الصور بأسماء ثابتة لتسهيل الاستبدال
        const ext = path.extname(file.originalname);
        const fieldName = req.params.type;
        cb(null, fieldName + ext);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// كلمة المرور السرية للإدارة (موجودة في الخادم فقط)
const ADMIN_SECRET = "ABDALLA SAO123";
let currentSettings = {
    adText: "مرحباً بك في مستقبل الذكاء الاصطناعي - آمن ومشفر بالكامل",
    systemPrompt: "You are ABD AI, an advanced assistant.",
    logoUrl: null,
    iconUrl: null,
    loaderImageUrl: null
};

// مسار التحقق من كلمة المرور
app.post('/api/admin-login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_SECRET) {
        // إرسال توكن وهمي للواجهة (للسماح بالدخول)
        res.json({ success: true, token: "admin_granted_" + Date.now(), settings: currentSettings });
    } else {
        res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });
    }
});

// مسار رفع الصور (شعار، أيقونة، صورة تحميل)
app.post('/api/upload/:type', upload.single('image'), (req, res) => {
    const type = req.params.type;
    if (!['logo', 'icon', 'loader'].includes(type)) {
        return res.status(400).json({ success: false, message: "نوع غير صالح" });
    }
    
    const filePath = `/uploads/${req.file.filename}`;
    
    // تحديث الإعدادات
    if (type === 'logo') currentSettings.logoUrl = filePath;
    if (type === 'icon') currentSettings.iconUrl = filePath;
    if (type === 'loader') currentSettings.loaderImageUrl = filePath;

    res.json({ success: true, message: "تم رفع الصورة بنجاح", path: filePath });
});

// مسار جلب الإعدادات الحالية (للعرض في الواجهة)
app.get('/api/settings', (req, res) => {
    res.json(currentSettings);
});

// مسار تحديث الإعلان النصي
app.post('/api/update-ad', (req, res) => {
    const { text } = req.body;
    if (text) {
        currentSettings.adText = text;
        res.json({ success: true, message: "تم التحديث" });
    } else {
        res.status(400).json({ success: false, message: "نص مطلوب" });
    }
});

// تشغيل الخادم وتقديم ملف الـ HTML
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT} - server.js:107`);
});