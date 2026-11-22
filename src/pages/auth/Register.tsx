import { useState } from 'react';

function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        alert('🎉 ثبت‌نام با موفقیت انجام شد!');
        setFormData({ full_name: '', email: '', password: '', phone: '' });
      } else {
        alert('خطا: ' + (data.detail || 'مشکلی پیش آمد'));
      }
    } catch (error) {
      alert('خطا در ارتباط با سرور');
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">ثبت‌نام در فروشگاه</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>نام و نام خانوادگی</label>
          <input name="full_name" placeholder="مثلاً: علی رضایی" onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>ایمیل</label>
          <input name="email" type="email" placeholder="example@email.com" onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>رمز عبور</label>
          <input name="password" type="password" placeholder="حداقل ۶ کاراکتر" onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>شماره تماس (اختیاری)</label>
          <input name="phone" placeholder="09121234567" onChange={handleChange} />
        </div>
        
        <button type="submit" className="submit-btn">ثبت‌نام</button>
      </form>
    </div>
  );
}

export default Register;
