/**
 * 静态科普文章数据
 * 
 * 维护规范：
 * - 每次修改文章内容或新增文章时，必须手动更新 updateTime 字段
 * - updateTime 格式：YYYY-MM-DD
 * - 文章 id 应与健康指标 key 对应（如 weight, meal 等）以便详情页置顶匹配
 */

import type { Article } from '@/types/article'

export const ARTICLES_DATA: Article[] = [
    {
        id: 'weight',
        title: '狗狗体重管理指南：科学控制，健康常伴',
        summary: '了解如何科学管理狗狗体重，预防肥胖带来的健康问题。',
        content: `<h2>为什么体重管理很重要？</h2>
<p>过重或过轻都会影响狗狗的健康。肥胖可能导致关节问题、心脏病和糖尿病，而体重过轻则可能是营养不良或疾病的信号。</p>

<h2>理想体重的判断标准</h2>
<p>可以通过"肋骨触摸法"来判断：轻轻触摸狗狗肋骨，如果能感觉到肋骨但不明显突出，说明体重适中。</p>

<h2>科学的体重管理建议</h2>
<ul>
<li>定期称重：建议每周固定时间称重并记录</li>
<li>控制饮食：根据体重和活动量调整每日摄入量</li>
<li>规律运动：每天保证30-60分钟的户外活动</li>
<li>避免零食过量：零食热量不应超过每日摄入的10%</li>
</ul>`,
        cover: '/static/images/articles/weight-management.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['weight', 'health', 'nutrition', 'exercise'],
        updateTime: '2025-05-12'
    },
    {
        id: 'meal',
        title: '狗狗饮食营养全攻略',
        summary: '从主粮选择到喂食量计算，全面解读狗狗的营养需求。',
        content: `<h2>狗狗的基本营养需求</h2>
<p>狗狗需要蛋白质、脂肪、碳水化合物、维生素和矿物质的均衡摄入。成年犬蛋白质需求约占日粮的18-25%。</p>

<h2>每日喂食量计算</h2>
<p>一般按体重计算：小型犬每公斤体重约需40-50kcal，中型犬35-40kcal，大型犬30-35kcal。</p>

<h2>喂食注意事项</h2>
<ul>
<li>固定喂食时间，培养规律饮食习惯</li>
<li>不要给狗狗吃巧克力、葡萄、洋葱等有毒食物</li>
<li>保持新鲜清洁的饮水供应</li>
</ul>`,
        cover: '/static/images/articles/dog-nutrition.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['meal', 'nutrition', 'diet', 'food'],
        updateTime: '2025-05-10'
    },
    {
        id: 'walk_duration',
        title: '狗狗运动指南：活力满满每一天',
        summary: '不同品种、年龄的狗狗运动需求各异，掌握科学运动方法。',
        content: `<h2>运动的重要性</h2>
<p>适量运动能帮助狗狗保持健康体重、增强心肺功能、释放精力、减少焦虑行为。</p>

<h2>不同犬种的运动需求</h2>
<ul>
<li>高能量犬种（边牧、金毛）：每天60-90分钟</li>
<li>中等能量犬种（柯基、柴犬）：每天30-60分钟</li>
<li>低能量犬种（法斗、巴哥）：每天20-30分钟</li>
</ul>

<h2>运动注意事项</h2>
<p>避免在炎热天气中长时间运动，注意补充水分，观察狗狗的疲劳信号。</p>`,
        cover: '/static/images/articles/dog-exercise.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['walk_duration', 'exercise', 'activity', 'health'],
        updateTime: '2025-05-08'
    },
    {
        id: 'deworming',
        title: '驱虫全攻略：守护毛孩健康防线',
        summary: '体内外驱虫的正确方法、频率和注意事项一网打尽。',
        content: `<h2>为什么要定期驱虫？</h2>
<p>寄生虫不仅影响狗狗健康，部分还可能传染给人类。定期驱虫是保护全家健康的重要措施。</p>

<h2>驱虫频率建议</h2>
<ul>
<li>体内驱虫：一般每3个月一次</li>
<li>体外驱虫：夏季每月一次，冬季可适当延长</li>
</ul>

<h2>驱虫后观察</h2>
<p>驱虫后注意观察狗狗排便情况，如发现虫体或异常症状，及时咨询兽医。</p>`,
        cover: '/static/images/articles/deworming.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['deworming', 'health', 'medication', 'prevention'],
        updateTime: '2025-05-06'
    },
    {
        id: 'rabies_vaccine',
        title: '疫苗接种指南：科学免疫，安心养宠',
        summary: '了解狗狗必须接种的疫苗类型、时间节点和注意事项。',
        content: `<h2>必须接种的疫苗</h2>
<p>狂犬病疫苗是法定必须接种的疫苗。此外，建议接种预防犬瘟、细小、传染性肝炎等疾病的多联疫苗。</p>

<h2>接种时间安排</h2>
<ul>
<li>幼犬：6-8周开始首针，每隔3-4周一针，共3针基础免疫</li>
<li>成犬：每年加强一次</li>
<li>狂犬疫苗：3月龄后接种，每年加强</li>
</ul>

<h2>接种注意事项</h2>
<p>接种后7天内避免洗澡和剧烈运动，观察是否有过敏反应。</p>`,
        cover: '/static/images/articles/vaccination.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['rabies_vaccine', 'vaccine', 'health', 'prevention', 'medication'],
        updateTime: '2025-05-04'
    },
    {
        id: 'tooth_brushing',
        title: '狗狗口腔护理：健康从"齿"开始',
        summary: '牙齿健康影响全身，学习正确的刷牙方法和口腔护理技巧。',
        content: `<h2>口腔健康的重要性</h2>
<p>据统计，3岁以上的狗狗中有80%存在不同程度的口腔问题。牙周病不仅导致口臭、牙齿脱落，还可能引发心脏、肾脏等器官疾病。</p>

<h2>日常刷牙建议</h2>
<ul>
<li>使用宠物专用牙刷和牙膏</li>
<li>建议每天刷牙，至少每周2-3次</li>
<li>从小培养刷牙习惯更容易被接受</li>
</ul>

<h2>辅助清洁方式</h2>
<p>除刷牙外，可搭配洁齿棒、洁齿玩具等辅助清洁。</p>`,
        cover: '/static/images/articles/dental-care.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['tooth_brushing', 'dental', 'health', 'grooming'],
        updateTime: '2025-05-02'
    },
    {
        id: 'bathing',
        title: '狗狗洗澡完全手册',
        summary: '洗澡频率、水温控制、洗护用品选择，一文掌握洗澡全流程。',
        content: `<h2>洗澡频率</h2>
<p>一般建议每1-2周洗澡一次。洗澡过频会破坏皮肤油脂平衡，过少则可能引发皮肤问题。</p>

<h2>洗澡步骤</h2>
<ol>
<li>先梳理毛发，去除打结</li>
<li>水温控制在37-38°C</li>
<li>使用宠物专用沐浴露</li>
<li>彻底冲洗干净，避免残留</li>
<li>立即吹干，防止着凉</li>
</ol>

<h2>特殊注意</h2>
<p>疫苗接种后7天内、生病期间、刚吃饱后不宜洗澡。</p>`,
        cover: '/static/images/articles/bathing.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['bathing', 'grooming', 'hygiene', 'care'],
        updateTime: '2025-04-28'
    },

    {
        id: 'shoulder_height',
        title: '狗狗肩高测量与生长发育指南',
        summary: '肩高是评估狗狗体型和发育的重要指标，了解正确测量方法。',
        content: `<h2>什么是肩高？</h2>
<p>肩高是指狗狗自然站立时，从地面到肩胛骨最高点的垂直距离，是判断犬种标准和生长发育的关键指标。</p>

<h2>如何正确测量肩高</h2>
<ol>
<li>让狗狗自然站立在平坦地面上</li>
<li>找到肩胛骨最高点（前腿与身体连接处）</li>
<li>使用测量尺从地面垂直测量到该点</li>
<li>记录数值，建议每月测量一次</li>
</ol>

<h2>不同犬种的肩高标准</h2>
<p>小型犬通常肩高25-40cm，中型犬40-60cm，大型犬60cm以上。具体标准因品种而异。</p>`,
        cover: '/static/images/articles/shoulder-height.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['shoulder_height', 'measurement', 'growth', 'health'],
        updateTime: '2025-04-22'
    },
    {
        id: 'body_temp',
        title: '狗狗体温监测：及时发现健康异常',
        summary: '体温是重要的健康指标，学会正确测量和判断异常体温。',
        content: `<h2>正常体温范围</h2>
<p>成年犬正常体温为38.0-39.3°C，幼犬略高可达39.5°C。体温持续超过39.5°C或低于37.5°C都需要警惕。</p>

<h2>测量方法</h2>
<ul>
<li>肛温测量：最准确，使用宠物专用体温计</li>
<li>耳温测量：使用宠物耳温枪，快速便捷</li>
<li>腋下测量：不够准确，仅供参考</li>
</ul>

<h2>异常体温的处理</h2>
<p>发烧时注意补水降温，低温时保暖。持续异常超过24小时应立即就医。</p>`,
        cover: '/static/images/articles/body-temp.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['body_temp', 'health', 'vital_signs', 'monitoring'],
        updateTime: '2025-04-20'
    },
    {
        id: 'body_fat',
        title: '狗狗体脂率管理：健康体态的秘密',
        summary: '体脂率比体重更能反映真实健康状况，学会科学管理。',
        content: `<h2>为什么关注体脂率？</h2>
<p>体重相同的狗狗，体脂率可能差异很大。高体脂率增加心脏负担和关节压力，低体脂率可能影响免疫力。</p>

<h2>理想体脂率范围</h2>
<p>健康成年犬体脂率建议在15-25%之间。运动犬可能更低，老年犬可能略高。</p>

<h2>如何降低体脂率</h2>
<ul>
<li>控制热量摄入，选择低脂高蛋白食物</li>
<li>增加有氧运动时间</li>
<li>避免高糖零食</li>
<li>定期监测，循序渐进</li>
</ul>`,
        cover: '/static/images/articles/body-fat.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['body_fat', 'weight', 'health', 'fitness'],
        updateTime: '2025-04-18'
    },
    {
        id: 'bmi',
        title: '狗狗BMI指数：快速评估体型',
        summary: '了解宠物BMI的计算方法和意义，科学评估体型。',
        content: `<h2>什么是宠物BMI？</h2>
<p>BMI（身体质量指数）是根据体重和身长计算的体型指数，用于快速评估狗狗是否超重或过瘦。</p>

<h2>BMI的参考范围</h2>
<p>正常范围因品种差异较大，一般18-26为适中。但BMI仅供参考，需结合体脂率和体态评分综合判断。</p>

<h2>体态评分法</h2>
<p>观察肋骨可见度、腰线明显度、腹部收紧程度，9分制评分中4-5分为理想体态。</p>`,
        cover: '/static/images/articles/bmi.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['bmi', 'weight', 'health', 'assessment'],
        updateTime: '2025-04-16'
    },
    {
        id: 'lean_mass',
        title: '去脂体重：肌肉质量的关键指标',
        summary: '去脂体重反映肌肉和骨骼质量，是评估健康的重要参数。',
        content: `<h2>什么是去脂体重？</h2>
<p>去脂体重 = 总体重 - 脂肪重量，包括肌肉、骨骼、内脏和水分。维持或增加去脂体重有助于提高代谢和运动能力。</p>

<h2>如何增加去脂体重</h2>
<ul>
<li>提供优质蛋白质（鸡肉、鱼肉、蛋类）</li>
<li>进行力量型训练（爬坡、游泳）</li>
<li>保证充足休息促进肌肉恢复</li>
<li>避免过度节食导致肌肉流失</li>
</ul>

<h2>监测建议</h2>
<p>配合体重和体脂率一起监测，理想状态是去脂体重稳定或缓慢上升。</p>`,
        cover: '/static/images/articles/lean-mass.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['lean_mass', 'muscle', 'fitness', 'health'],
        updateTime: '2025-04-14'
    },
    {
        id: 'waist',
        title: '狗狗腰围测量：脂肪分布的晴雨表',
        summary: '腰围变化能及时反映脂肪堆积情况，预防肥胖。',
        content: `<h2>为什么要测量腰围？</h2>
<p>腰围是反映腹部脂肪堆积的敏感指标。腰围快速增加往往早于体重明显上升，是肥胖的早期信号。</p>

<h2>正确测量方法</h2>
<ol>
<li>让狗狗自然站立</li>
<li>找到最后一根肋骨后方的最细处</li>
<li>用软尺水平环绕测量</li>
<li>呼气时记录数值</li>
</ol>

<h2>腰围管理建议</h2>
<p>定期测量并记录，如一个月内增加超过5%，需调整饮食和运动计划。</p>`,
        cover: '/static/images/articles/waist.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['waist', 'weight', 'measurement', 'health'],
        updateTime: '2025-04-12'
    },
    {
        id: 'water',
        title: '狗狗饮水管理：生命之源不可忽视',
        summary: '充足饮水对健康至关重要，了解正确的饮水量和注意事项。',
        content: `<h2>每日饮水量标准</h2>
<p>一般建议：体重(kg) × 50-70ml/天。例如10kg的狗狗每天需要500-700ml水。运动后和炎热天气需适当增加。</p>

<h2>饮水不足的危害</h2>
<ul>
<li>泌尿系统疾病风险增加</li>
<li>便秘问题</li>
<li>皮肤干燥</li>
<li>代谢功能下降</li>
</ul>

<h2>如何鼓励多喝水</h2>
<p>提供新鲜干净的水，多处放置水碗，尝试流动饮水器，在食物中添加水分。</p>`,
        cover: '/static/images/articles/water.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['water', 'hydration', 'health', 'nutrition'],
        updateTime: '2025-04-10'
    },
    {
        id: 'protein',
        title: '蛋白质营养：肌肉和免疫的基石',
        summary: '蛋白质是狗狗最重要的营养素，了解需求量和优质来源。',
        content: `<h2>蛋白质的重要性</h2>
<p>蛋白质是肌肉、皮毛、免疫系统的主要组成部分。成年犬每日蛋白质需求约占食物的18-25%，幼犬和运动犬需求更高。</p>

<h2>优质蛋白质来源</h2>
<ul>
<li>动物性：鸡肉、牛肉、鱼肉、蛋类</li>
<li>植物性：豆类（需适量，避免胀气）</li>
<li>选择生物价值高的蛋白质</li>
</ul>

<h2>蛋白质过量的风险</h2>
<p>过量蛋白质可能增加肾脏负担，特别是老年犬和肾病犬需要控制摄入。</p>`,
        cover: '/static/images/articles/protein.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['protein', 'nutrition', 'diet', 'health'],
        updateTime: '2025-04-08'
    },
    {
        id: 'carb',
        title: '碳水化合物：能量来源的平衡之道',
        summary: '合理摄入碳水化合物，为狗狗提供充足能量。',
        content: `<h2>碳水化合物的作用</h2>
<p>碳水化合物是主要能量来源，支持日常活动和大脑功能。但狗狗对碳水的需求低于人类。</p>

<h2>推荐摄入量</h2>
<p>一般占食物的30-50%即可。运动量大时可适当增加，减重期应减少。</p>

<h2>优质碳水来源</h2>
<ul>
<li>全谷物：糙米、燕麦</li>
<li>薯类：红薯、土豆</li>
<li>避免精制碳水和高糖食物</li>
</ul>`,
        cover: '/static/images/articles/carb.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['carb', 'nutrition', 'energy', 'diet'],
        updateTime: '2025-04-06'
    },
    {
        id: 'fat',
        title: '脂肪营养：必需但需适量',
        summary: '脂肪提供能量和必需脂肪酸，但过量会导致肥胖。',
        content: `<h2>脂肪的重要功能</h2>
<p>脂肪提供浓缩能量，帮助吸收脂溶性维生素，维持皮肤和毛发健康。必需脂肪酸（Omega-3和Omega-6）狗狗无法自身合成。</p>

<h2>推荐摄入量</h2>
<p>成年犬脂肪占食物的10-15%，幼犬和运动犬可达20%。减重期控制在8-10%。</p>

<h2>优质脂肪来源</h2>
<ul>
<li>鱼油（富含Omega-3）</li>
<li>鸡脂、牛脂（适量）</li>
<li>亚麻籽油</li>
</ul>`,
        cover: '/static/images/articles/fat.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['fat', 'nutrition', 'diet', 'health'],
        updateTime: '2025-04-04'
    },
    {
        id: 'diet_energy',
        title: '膳食能量管理：热量平衡的艺术',
        summary: '了解狗狗的能量需求，实现摄入与消耗的平衡。',
        content: `<h2>每日能量需求</h2>
<p>基础代谢率(RER) = 70 × (体重kg)^0.75。实际需求需乘以活动系数：绝育成犬1.6，未绝育1.8，高活动量2.0-5.0。</p>

<h2>能量平衡原则</h2>
<ul>
<li>维持体重：摄入 = 消耗</li>
<li>减重：摄入 < 消耗（减少10-20%）</li>
<li>增重：摄入 > 消耗（增加10-20%）</li>
</ul>

<h2>记录与调整</h2>
<p>记录每日摄入的所有食物热量，包括零食。每周评估体重变化并调整。</p>`,
        cover: '/static/images/articles/diet_energy.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['diet_energy', 'nutrition', 'weight', 'health'],
        updateTime: '2025-04-02'
    },
    {
        id: 'run_distance',
        title: '狗狗跑步训练：循序渐进的耐力提升',
        summary: '科学规划跑步距离，避免运动损伤。',
        content: `<h2>跑步的益处</h2>
<p>跑步能有效提升心肺功能、增强肌肉力量、消耗多余能量、改善情绪。</p>

<h2>距离规划建议</h2>
<ul>
<li>初学者：每次1-2公里，每周3次</li>
<li>进阶：逐步增加至5-10公里</li>
<li>每周增幅不超过10%</li>
<li>大型犬耐力更好，小型犬需适当减少</li>
</ul>

<h2>注意事项</h2>
<p>避免高温时段，注意路面温度，观察疲劳信号，及时补水。</p>`,
        cover: '/static/images/articles/run_distance.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['run_distance', 'exercise', 'training', 'fitness'],
        updateTime: '2025-03-30'
    },
    {
        id: 'run_pace',
        title: '跑步配速控制：找到最佳运动强度',
        summary: '合理控制配速，提升训练效果，预防过度疲劳。',
        content: `<h2>什么是配速？</h2>
<p>配速是指完成每公里所需时间，数值越小速度越快。合理配速能提高训练效率，避免受伤。</p>

<h2>配速建议</h2>
<ul>
<li>轻松跑：6-8分钟/公里，可长时间维持</li>
<li>有氧跑：5-6分钟/公里，提升耐力</li>
<li>间歇跑：4-5分钟/公里，短时间冲刺</li>
</ul>

<h2>如何判断强度</h2>
<p>观察狗狗呼吸频率和舌头颜色，能保持规律呼吸为宜，过度喘息需减速。</p>`,
        cover: '/static/images/articles/run_pace.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['run_pace', 'exercise', 'training', 'fitness'],
        updateTime: '2025-03-28'
    },
    {
        id: 'fitness_training',
        title: '狗狗体能训练：打造强健体魄',
        summary: '系统的体能训练计划，提升狗狗整体运动能力。',
        content: `<h2>体能训练的组成</h2>
<ul>
<li>有氧训练：跑步、游泳</li>
<li>力量训练：爬坡、负重行走</li>
<li>灵活性训练：跳跃、穿越障碍</li>
<li>平衡训练：平衡板、不稳定表面</li>
</ul>

<h2>训练强度评分</h2>
<p>1-10分主观评分，1-3为轻松，4-6为中等，7-10为高强度。建议80%时间保持中低强度，20%高强度。</p>

<h2>恢复的重要性</h2>
<p>高强度训练后需要1-2天恢复期，避免连续高强度导致过度训练。</p>`,
        cover: '/static/images/articles/fitness_training.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['fitness_training', 'exercise', 'training', 'health'],
        updateTime: '2025-03-26'
    },
    {
        id: 'training',
        title: '狗狗训练指南：培养良好行为习惯',
        summary: '系统的训练方法，让狗狗更听话、更快乐。',
        content: `<h2>基础训练项目</h2>
<ul>
<li>坐下、趴下、等待</li>
<li>召回训练</li>
<li>随行训练</li>
<li>社交化训练</li>
</ul>

<h2>训练原则</h2>
<p>正向强化为主，及时奖励正确行为。每次训练10-15分钟，保持狗狗注意力。避免体罚，耐心引导。</p>

<h2>训练时间安排</h2>
<p>每天2-3次，每次10-30分钟。幼犬注意力短，时间可缩短。</p>`,
        cover: '/static/images/articles/training.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['training', 'behavior', 'education', 'obedience'],
        updateTime: '2025-03-24'
    },
    {
        id: 'stool',
        title: '狗狗排便健康：消化系统的晴雨表',
        summary: '通过观察排便情况，及时发现消化系统问题。',
        content: `<h2>正常排便标准</h2>
<p>成年犬每天1-2次，幼犬3-5次。粪便应成型、湿润但不粘，颜色为棕色。</p>

<h2>异常排便信号</h2>
<ul>
<li>腹泻：水样或稀软，可能是饮食不当或感染</li>
<li>便秘：干硬难排，需增加纤维和水分</li>
<li>带血：鲜红色或黑色，需立即就医</li>
<li>粘液：少量正常，过多需关注</li>
</ul>

<h2>改善消化健康</h2>
<p>规律饮食，充足饮水，适量运动，必要时补充益生菌。</p>`,
        cover: '/static/images/articles/stool.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['stool', 'digestion', 'health', 'monitoring'],
        updateTime: '2025-03-22'
    },
    {
        id: 'anxiety',
        title: '狗狗焦虑症：识别与缓解',
        summary: '了解焦虑的表现和原因，帮助狗狗建立安全感。',
        content: `<h2>焦虑的常见表现</h2>
<ul>
<li>过度吠叫或嚎叫</li>
<li>破坏性行为</li>
<li>过度舔舐或啃咬自己</li>
<li>食欲下降</li>
<li>频繁踱步</li>
</ul>

<h2>焦虑的常见原因</h2>
<p>分离焦虑、环境变化、缺乏社交、创伤经历、遗传因素等。</p>

<h2>缓解方法</h2>
<ul>
<li>增加陪伴时间和互动</li>
<li>提供安全的独处空间</li>
<li>规律的作息和运动</li>
<li>使用安抚玩具</li>
<li>必要时咨询行为专家</li>
</ul>`,
        cover: '/static/images/articles/anxiety.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['anxiety', 'mental_health', 'behavior', 'wellness'],
        updateTime: '2025-03-20'
    },
    {
        id: 'depression',
        title: '狗狗抑郁症：别让毛孩心情低落',
        summary: '识别抑郁信号，采取措施改善狗狗情绪。',
        content: `<h2>抑郁的表现</h2>
<ul>
<li>活力明显下降，不愿活动</li>
<li>对喜欢的事物失去兴趣</li>
<li>食欲减退</li>
<li>睡眠时间异常增加</li>
<li>回避互动</li>
</ul>

<h2>可能的原因</h2>
<p>失去同伴、主人长期离开、环境巨变、疾病疼痛、缺乏刺激等。</p>

<h2>改善措施</h2>
<ul>
<li>增加户外活动和阳光照射</li>
<li>提供新鲜有趣的玩具和游戏</li>
<li>保持规律作息</li>
<li>考虑增加宠物伙伴</li>
<li>持续超过2周需就医</li>
</ul>`,
        cover: '/static/images/articles/depression.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['depression', 'mental_health', 'behavior', 'wellness'],
        updateTime: '2025-03-18'
    },
    {
        id: 'fish_oil',
        title: '鱼油补充：Omega-3的神奇功效',
        summary: '鱼油富含Omega-3脂肪酸，对皮肤、关节和心脏都有益处。',
        content: `<h2>鱼油的主要功效</h2>
<ul>
<li>改善皮肤和毛发健康，减少瘙痒</li>
<li>支持关节健康，缓解炎症</li>
<li>促进心脏和大脑功能</li>
<li>增强免疫系统</li>
</ul>

<h2>推荐用量</h2>
<p>按体重计算：小型犬(10kg以下)每天0.5-1ml，中型犬1-1.5ml，大型犬1.5-2ml。</p>

<h2>选择与保存</h2>
<p>选择宠物专用鱼油，避免人用产品。开封后冷藏保存，避免氧化。</p>`,
        cover: '/static/images/articles/fish_oil.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['fish_oil', 'supplement', 'nutrition', 'health'],
        updateTime: '2025-03-16'
    },
    {
        id: 'calcium',
        title: '钙质补充：骨骼健康的基础',
        summary: '了解钙的重要性和正确补充方法，避免过量风险。',
        content: `<h2>钙的重要作用</h2>
<p>钙是骨骼和牙齿的主要成分，参与神经传导、肌肉收缩、血液凝固等重要功能。</p>

<h2>每日需求量</h2>
<p>成年犬约需50-100mg/kg体重。幼犬和哺乳期母犬需求更高。</p>

<h2>补钙注意事项</h2>
<ul>
<li>优质狗粮通常已含足够钙质</li>
<li>过量补钙可能导致骨骼发育异常</li>
<li>需配合维生素D促进吸收</li>
<li>大型犬幼犬尤其需注意钙磷比例</li>
</ul>`,
        cover: '/static/images/articles/calcium.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['calcium', 'supplement', 'bone_health', 'nutrition'],
        updateTime: '2025-03-14'
    },
    {
        id: 'fiber',
        title: '膳食纤维：肠道健康的守护者',
        summary: '适量纤维促进消化，了解来源和推荐摄入量。',
        content: `<h2>纤维的作用</h2>
<ul>
<li>促进肠道蠕动，预防便秘</li>
<li>帮助控制体重，增加饱腹感</li>
<li>调节血糖水平</li>
<li>支持肠道有益菌群</li>
</ul>

<h2>推荐摄入量</h2>
<p>一般建议每天2-5克，具体根据体重调整。减重期可适当增加。</p>

<h2>优质纤维来源</h2>
<ul>
<li>南瓜、红薯</li>
<li>胡萝卜、西兰花</li>
<li>燕麦、糙米</li>
<li>苹果（去核）</li>
</ul>

<h2>注意事项</h2>
<p>过量纤维可能影响营养吸收，导致腹泻或胀气。</p>`,
        cover: '/static/images/articles/fiber.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['fiber', 'nutrition', 'digestion', 'health'],
        updateTime: '2025-03-12'
    },
    {
        id: 'vomiting',
        title: '狗狗呕吐：原因分析与应对',
        summary: '了解呕吐的常见原因，判断何时需要就医。',
        content: `<h2>呕吐的常见原因</h2>
<ul>
<li>进食过快或过量</li>
<li>食物不耐受或过敏</li>
<li>吞食异物</li>
<li>胃肠道疾病</li>
<li>寄生虫感染</li>
<li>中毒</li>
</ul>

<h2>何时需要就医</h2>
<p>以下情况需立即就医：</p>
<ul>
<li>呕吐物带血</li>
<li>持续呕吐超过24小时</li>
<li>伴随腹泻、发烧、精神萎靡</li>
<li>怀疑吞食异物或中毒</li>
</ul>

<h2>家庭护理</h2>
<p>轻微呕吐可禁食12-24小时，提供少量水。恢复后从少量易消化食物开始。</p>`,
        cover: '/static/images/articles/vomiting.png',
        category: 'education',
        author: 'iPet 健康团队',
        tags: ['vomiting', 'health', 'digestion', 'emergency'],
        updateTime: '2025-03-10'
    }
]

/**
 * 获取所有文章（静态数据）
 */
export function getAllArticles(): Article[] {
    return ARTICLES_DATA
}

/**
 * 按ID获取文章
 */
export function getArticleById(id: string): Article | undefined {
    return ARTICLES_DATA.find(article => article.id === id)
}

/**
 * 获取最新文章（按 updateTime 降序排列）
 * @param count 返回数量，默认3
 */
export function getLatestArticles(count: number = 3): Article[] {
    return [...ARTICLES_DATA]
        .sort((a, b) => {
            const dateA = a.updateTime || ''
            const dateB = b.updateTime || ''
            if (dateA === dateB) {
                return a.id.localeCompare(b.id)
            }
            return dateB.localeCompare(dateA)
        })
        .slice(0, count)
}

/**
 * 按标签获取相关文章
 * @param tags 标签数组
 * @param excludeId 排除的文章ID
 * @param count 返回数量
 */
export function getArticlesByTags(tags: string[], excludeId?: string, count: number = 3): Article[] {
    return ARTICLES_DATA
        .filter(article => article.id !== excludeId)
        .map(article => ({
            article,
            matchCount: article.tags.filter(tag => tags.includes(tag)).length
        }))
        .filter(item => item.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, count)
        .map(item => item.article)
}
