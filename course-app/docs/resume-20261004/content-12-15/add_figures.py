from pathlib import Path
import fitz,json,hashlib
B=Path(__file__).resolve().parent
P=next(Path('/workspace/scratch/67c4ddcee7f7/upload').glob('新HSK教程1(*.pdf'));pdf=fitz.open(P)
D={l:json.loads((B/f'lesson-{l}.json').read_text()) for l in range(12,16)}
C=lambda z,v:{'zh':z,'vi':v}
photos={
12:[(87,(385,423,645,799),'王一飞在窗边打电话，窗外下着雨。','Vương Nhất Phi gọi điện cạnh cửa sổ, ngoài trời mưa.'),(89,(401,400,677,754),'王一雪和戴口罩的杨同乐在公司电梯里。','Vương Nhất Tuyết và Dương Đồng Lạc đeo khẩu trang trong thang máy công ty.'),(91,(420,196,706,359),'杨同乐在医院看病。','Dương Đồng Lạc khám bệnh ở bệnh viện.')],
13:[(96,(373,425,645,622),'白家月在教室向王老师提问。','Bạch Gia Nguyệt hỏi cô Vương trong lớp.'),(98,(414,374,679,645),'王一雪在咖啡馆点早餐，图中有面包和鸡蛋。','Vương Nhất Tuyết gọi bữa sáng ở quán cà phê, trong hình có bánh mì và trứng.'),(100,(344,170,647,343),'一盘饺子。','Một đĩa sủi cảo.')],
14:[(104,(364,404,646,551),'白家月和陈天中在教室交谈。','Bạch Gia Nguyệt và Trần Thiên Trung trò chuyện trong lớp.'),(106,(209,773,562,967),'王老师在课堂上询问学生。','Cô Vương hỏi các học sinh trong lớp.'),(108,(177,748,533,968),'刘明和王一雪在家看孩子的照片。','Lưu Minh và Vương Nhất Tuyết xem ảnh các con ở nhà.')],
15:[(113,(413,400,703,576),'李文请朋友品尝的中国菜。','Các món Trung Quốc Lý Văn mời bạn thưởng thức.'),(115,(474,76,707,473),'上下两幅照片分别是西安和北京，附原书地名。','Hai ảnh lần lượt là Tây An và Bắc Kinh, kèm địa danh trong sách.'),(116,(70,401,647,859),'大兴机场航站楼鸟瞰图。','Ảnh nhìn từ trên cao của nhà ga sân bay Đại Hưng.')]
}
for l,rows in photos.items():
 for t,(p,xy,z,v) in enumerate(rows,1):
  rect=fitz.Rect(*[round(n/1.3,5) for n in xy]);name=f'l{l}-text-{t}-photo';file=B/'figures'/f'{name}.png';pdf[p+14].get_pixmap(matrix=fitz.Matrix(2,2),clip=rect).save(file);sha=hashlib.sha256(file.read_bytes()).hexdigest()
  fig={'id':name,'file':f'figures/{file.name}','alt':C(z,v),'source':{'textbookSHA256':D[l]['textbookSHA256'],'printedPage':p,'pdfPage':p+15,'cell':f'text-{t}-photo','cropPdfPoints':list(rect)},'kind':'original-crop','sha256':sha,'note':C('原书配图局部原图裁切，未重画。','Ảnh minh họa được cắt trực tiếp từ sách, không vẽ lại.')};D[l]['figures'].append(fig)
  a=next(a for a in D[l]['activities'] if a['source']['section']==f'text-{t}-role-reading');a['figure']=name;a['figureSHA256']=sha
for l,d in D.items():(B/f'lesson-{l}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
