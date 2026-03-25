import React from 'react';
import styles from './AboutSection.module.css';

const AboutSection: React.FC = () => {
  return (
    <section className={styles.aboutSection}>
      <div className="container">
        <div className={styles.wrapper}>
          <div className={styles.content}>
            <span className={styles.badge}>Câu chuyện của chúng tôi</span>
            <h2 className={styles.title}>
              Hương vị <span className={styles.highlight}>gia đình</span> trong từng món ăn
            </h2>
            <p className={styles.description}>
              Tại <strong>Nhà Hàng Khói Quê</strong>, chúng tôi tin rằng ẩm thực không chỉ là ăn uống, mà là sự kết nối. 
              Mỗi thực đơn được chuẩn bị tỉ mỉ với nguyên liệu tươi sạch, mang đậm bản sắc truyền thống kết hợp cùng phong cách chế biến tân cổ điển.
            </p>
            <div className={styles.features}>
              <div className={styles.featureItem}>
                <div className={styles.iconWrapper}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <div>
                  <h4>Nguyên liệu tươi sạch</h4>
                  <p>Tuyển chọn kỹ lưỡng mỗi ngày từ các nguồn cung ứng uy tín.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.iconWrapper}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div>
                  <h4>Đầu bếp chuẩn 5 sao</h4>
                  <p>Đội ngũ chuyên nghiệp với đam mê mang lại trải nghiệm tốt nhất.</p>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.visual}>
            <div className={styles.imageCard}>
              <img 
                src="https://cdn.eva.vn/upload/3-2023/images/2023-08-07/me-dam-goi-y-thuc-don-tuan-365749682_6336549346465978_8473341633132913147_n-1691380788-912-width780height740.jpg" 
                alt="Thực đơn tuần" 
                className={styles.mainImage}
              />
              <div className={styles.experienceBadge}>
                <span className={styles.years}>15+</span>
                <span className={styles.expLabel}>Năm kinh nghiệm</span>
              </div>
            </div>
            {/* Geometric accents */}
            <div className={styles.circle} />
            <div className={styles.square} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
