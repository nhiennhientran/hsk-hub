from pathlib import Path
import json
B=Path(__file__).resolve().parent;R=B.parents[3];base=json.loads((R/'hsk1-app/content/textbook.json').read_text())['lessons']
C=lambda z,v:{'zh':z,'vi':v}
POS={12:['n.','pron.','n.','','part.','n.','adv.','v.','adj.','v.','n.','v.','n.','v.','v.','v.','num.-m.','n.','m.','v.','adv.','v.','adj.','n.'],13:['mod.','adv.','n.','v.','','num.-m.','n.','n.','v.','v.','v.','n.','v.','n.','pron.','n.','n.','n.','num.','n.'],14:['v.','n.','n.','v.','pron.','pron.','part.','v.','adv.','v.','adv.','v.','v.','pron.','n.','n.','v.','n.','n.','n.','n.','v.','pron.','pron.','pron.','adj.'],15:['v.','pron.','n.','n.','num.','n.','adj.','n.','v.','n.','n.','n.','n.','v.','v.','adj.','conj.']}
V={'n.':'danh từ','pron.':'đại từ','v.':'động từ','adj.':'tính từ','adv.':'phó từ','part.':'trợ từ','num.-m.':'số từ–lượng từ','m.':'lượng từ','mod.':'động từ năng nguyện','num.':'số từ','conj.':'liên từ','':''}
vi={
12:['Bên ngoài đang có tuyết rơi, lạnh quá!','Anh ấy đã đi làm ở công ty.','Bác sĩ: Anh cảm thấy thế nào?\nDương Đồng Lạc: Tôi rất lạnh.','Vương Nhất Tuyết: Hôm qua anh đã đến bệnh viện khám bệnh chưa?\nDương Đồng Lạc: Chưa, hôm nay tôi đi.'],
13:['Xin cho tôi một cốc nước ấm.','Chúng tôi muốn gọi một 斤 sủi cảo (500 gam).','A: Tôi ngồi đây được không?\nB: Không vấn đề gì, mời ngồi.','A: Cửa hàng này có bán điện thoại không?\nB: Bạn có thể đến hỏi thử.'],
14:['Tôi đã viết rất nhiều chữ Hán.','Anh ấy không nghe thấy giáo viên nói gì.','Bạch Gia Nguyệt: Hôm qua các bạn làm gì trên xe?\nTrần Thiên Trung: Tôi đã đọc một cuốn sách, có người đang ngủ.','Lưu Minh: Năm sau, khi đi học, các con đều sẽ bận.\nVương Nhất Tuyết: Đúng vậy.'],
15:['Cuốn sách này có 15 bài, chúng tôi đã học hết rồi.','Mọi người trong gia đình tôi đều thích uống trà.','Trần Thiên Trung: Tối mai chúng tôi đến lúc sáu giờ, bạn thấy có sớm không?\nLý Văn: Không sớm.','Vương Nhất Phi: Họ muốn đi máy bay đến Bắc Kinh, còn các bạn?\nTrần Thiên Trung: Chúng tôi không có thời gian, không thể đi chơi.']}
note='Nghĩa toàn câu để hiểu ngữ cảnh; chỉ điền các chỗ trống trong câu tiếng Trung, không điền từng từ vào bản dịch.'
for l in range(12,16):
 p=B/f'lesson-{l}.json';d=json.loads(p.read_text())
 for a in d['activities']:
  s=a['source']['section']
  if s=='vocabulary':
   t=a['table'];t['columns'].append(C('词性','Từ loại'))
   for row in t['rows']:
    ordinal=int(row['id'].split('-')[-1]);pos=POS[l][ordinal-1];row['cells'].append({'text':C(pos,V[pos])})
  if s.endswith('-role-reading'):
   t=int(s.split('-')[1]);scene=base[l-1]['scenes'][t-1]
   a['pinyin']='\n'.join(f"{x['s']}：{x['py']}" for x in scene['lines'])
   a['pinyinProvenance']={'basis':'existing-scene-pinyin-checked-against-original-dialogue','sceneId':scene['id'],'style':'word-spaced-normalized-pinyin; same pronunciation as printed dialogue','independentReview':'pending'}
  if s=='comprehensive-cloze':
   a['prompt']['vi']=vi[l][a['source']['ordinal']-1]+'\n\n'+note
   a['translationPolicy']='Vietnamese gives complete meaning, not blank-by-blank word alignment.'
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
