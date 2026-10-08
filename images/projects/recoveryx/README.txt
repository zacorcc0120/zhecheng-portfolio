RecoveryX · 15 images

Delivered PNGs re-encoded to WebP masters. Quality 96, method 6, exact RGB.
No rescaling: public/ holds the masters at their delivered size and
Next.js emits the sized derivatives per request.

source                   output                           size  ratio  note
01-hero.png              cover.webp                  3840x2160   16:9  首页 Hero，三台设备同框
02-recovery-hero.png     recovery-hero.webp          3840x2160   16:9  恢复主视觉，88% 与趋势图为主
03-training-home.png     training-home.webp          2400x3000    4:5  训练首页
04-recovery-center.png   recovery-center.webp        2400x3000    4:5  恢复中心
05-sleep-assessment.png  sleep-assessment.webp       2400x3000    4:5  睡眠自评
06-energy-assessment.png energy-assessment.webp      2400x3000    4:5  精力自评
07-discomfort-assessment.png discomfort-assessment.webp  2400x3000    4:5  身体不适自评
08-questionnaire.png     questionnaire.webp          2400x3000    4:5  问卷评估
09-assessment-result.png assessment-result.webp      2400x3000    4:5  评估结果
10-add-exercise.png      add-exercise.webp           2400x3000    4:5  添加动作
11-training-detail.png   training-detail.webp        2400x3000    4:5  训练详情
12-training-history.png  training-history.webp       2400x3000    4:5  训练历史
13-feature-overview.png  feature-overview.webp       3200x3200    1:1  功能总览
14-brand-poster.png      brand-poster.webp           3200x3200    1:1  品牌海报
15-closing-overview.png  closing-overview.webp       3200x3200    1:1  收尾总览

total 44916 KB -> 5803 KB

Encoder: Pillow. ffmpeg's libwebp in this build drops the codec-private
-quality flag, so q92/q95/q100 came out byte-identical and were unusable.
