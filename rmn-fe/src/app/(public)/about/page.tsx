import React from 'react';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/Footer/Footer';
import styles from './AboutPage.module.css';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* HERO SECTION */}
        <section className={styles.hero}>
          <div className={styles.heroOverlay}>
            <div className="container">
              <h1 className={styles.heroTitle}>Tinh Hoa Ẩm Thực Dân Gian</h1>
              <p className={styles.heroSubtitle}>Gói trọn hồn quê trong từng hương vị hiện đại</p>
            </div>
          </div>
        </section>

        {/* STORY SECTION */}
        <section className={styles.storySection}>
          <div className="container">
            <div className={styles.grid}>
              <div className={styles.textContent}>
                <span className={styles.badge}>Hành trình của chúng tôi</span>
                <h2 className={styles.sectionTitle}>Từ gian bếp xưa đến bàn tiệc hiện đại</h2>
                <p className={styles.text}>
                  Nhà hàng <strong>Khói Quê</strong> ra đời từ mong muốn gìn giữ và tôn vinh những giá trị ẩm thực dân gian Việt Nam. 
                  Chúng tôi không chỉ bán món ăn, chúng tôi kể những câu chuyện về nguồn cội, về tình thân và về sự tỉ mỉ của người đầu bếp Việt qua bao đời.
                </p>
                <p className={styles.text}>
                  Chúng tôi tin rằng "ăn ngon" không chỉ là sự thỏa mãn vị giác, mà còn là sự kết nối tâm hồn. 
                  Mỗi đĩa thức ăn tại Khói Quê là sự kết hợp hài hòa giữa nguyên liệu tươi sạch của địa phương và kỹ thuật chế biến tân cổ điển tinh tế.
                </p>
              </div>
              <div className={styles.imageContent}>
                <div className={styles.imageCircle}>
                  <img 
                    src="https://cdn.eva.vn/upload/3-2023/images/2023-08-07/me-dam-goi-y-thuc-don-tuan-365749682_6336549346465978_8473341633132913147_n-1691380788-912-width780height740.jpg" 
                    alt="Our story" 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRESS QUOTES */}
        <section className={styles.pressSection}>
          <div className="container">
             <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitleCenter}>Báo chí nói gì về món ăn Việt?</h2>
                <p className={styles.sectionSubCenter}>Ẩm thực dân gian không chỉ là niềm tự hào dân tộc mà còn là di sản văn hóa thế giới</p>
             </div>
             <div className={styles.quoteGrid}>
                <div className={styles.quoteCard}>
                    <p className={styles.quoteText}>Bún bò Huế là món súp tuyệt vời nhất thế giới mà tôi từng được thưởng thức.</p>
                    <span className={styles.author}>— Anthony Bourdain, CNN</span>
                </div>
                <div className={styles.quoteCard}>
                    <p className={styles.quoteText}>Phở Việt Nam - Món ăn chứa đựng sự cân bằng hoàn hảo giữa âm và dương, thanh tao nhưng đầy lôi cuốn.</p>
                    <span className={styles.author}>— The Travel Magazine</span>
                </div>
                <div className={styles.quoteCard}>
                    <p className={styles.quoteText}>Ẩm thực Việt Nam chinh phục thế giới bằng sự tươi ngon của nguyên liệu và cách phối trộn gia vị bậc thầy.</p>
                    <span className={styles.author}>— Culinary Press</span>
                </div>
             </div>
          </div>
        </section>

        {/* PHILOSOPHY SECTION */}
        <section className={styles.philosophySection}>
            <div className="container">
                <div className={styles.philWrapper}>
                    <div className={styles.philBadge}>Triết lý kinh doanh</div>
                    <h2 className={styles.philTitle}>3 Giá Trị Cốt Lõi</h2>
                    <div className={styles.philGrid}>
                        <div className={styles.philItem}>
                            <h3>Nguyên Bản</h3>
                            <p>Không làm mất đi hương vị đặc trưng truyền thống của tổ tiên.</p>
                        </div>
                        <div className={styles.philItem}>
                            <h3>Sạch</h3>
                            <p>100% nguyên liệu có nguồn gốc rõ ràng, đạt chuẩn VietGAP.</p>
                        </div>
                        <div className={styles.philItem}>
                            <h3>Tận Tâm</h3>
                            <p>Phục vụ khách hàng như người thân trong gia đình trở về nhà.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CALL TO ACTION */}
        <section className={styles.cta}>
           <div className="container">
              <h2>Bạn đã sẵn sàng để trải nghiệm chưa?</h2>
              <p>Đặt bàn ngay để nhận ưu đãi 10% cho khách hàng mới</p>
              <a href="/booking" className={styles.ctaBtn}>Đặt bàn ngay</a>
           </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
