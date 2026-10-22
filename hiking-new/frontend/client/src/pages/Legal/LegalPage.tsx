import { Link, useLocation } from 'react-router-dom';
import Seo from '@client/src/components/Seo';
import { SITE_CONTACT } from '@client/src/data/site-config';

interface LegalDocument {
  title: string;
  description: string;
  sections: { heading: string; body: string[] }[];
}

const DOCUMENTS: Record<string, LegalDocument> = {
  '/privacy': {
    title: '隐私政策',
    description: '说明徒步中国如何收集、使用、保存和保护用户信息。',
    sections: [
      {
        heading: '我们收集的信息',
        body: [
          '我们仅在提供服务所需的范围内收集账号信息、内容信息、活动报名信息和必要的技术日志。',
          '密码使用不可逆哈希保存，我们不会以明文形式存储密码。',
        ],
      },
      {
        heading: '信息的使用',
        body: [
          '信息用于账号登录、内容发布、评论互动、活动报名、安全风控和产品改进。',
          '我们不会出售你的个人信息。',
        ],
      },
      {
        heading: '你的权利',
        body: [
          '你可以申请导出、更正或删除个人信息。账号注销后，我们会在冷静期结束后匿名化或删除相关数据。',
        ],
      },
    ],
  },
  '/terms': {
    title: '用户协议',
    description: '使用徒步中国服务前需要了解的权利与责任。',
    sections: [
      {
        heading: '账号与内容',
        body: [
          '用户应保证注册信息真实、合法，并对发布的内容承担责任。',
          '禁止发布违法、侵权、欺诈、骚扰、广告垃圾或危害他人的内容。',
        ],
      },
      {
        heading: '活动风险',
        body: [
          '户外活动存在客观风险，参与者应根据自身能力评估路线、天气和装备条件。',
          '平台提供信息交流服务，不替代专业领队、保险和安全判断。',
        ],
      },
    ],
  },
  '/community-guidelines': {
    title: '社区规范',
    description: '徒步中国社区的内容和互动规范。',
    sections: [
      {
        heading: '真实分享',
        body: ['路线、装备和活动信息应尽量标明时间、来源和适用条件，避免误导他人。'],
      },
      {
        heading: '尊重与安全',
        body: ['尊重当地环境、居民和同行者。禁止人身攻击、歧视、骚扰和危险引导。'],
      },
      {
        heading: '商业内容',
        body: ['商业合作和推广应明确标注，不得伪装成普通用户经验分享。'],
      },
    ],
  },
  '/disclaimer': {
    title: '免责声明',
    description: '徒步中国关于户外活动信息和用户内容的免责声明。',
    sections: [
      {
        heading: '信息仅供参考',
        body: ['平台中的路线、装备和活动信息由用户或编辑整理，可能存在时效性和地区差异。'],
      },
      {
        heading: '风险自担',
        body: ['用户应独立判断户外风险，并根据实际情况准备装备、保险和应急方案。'],
      },
    ],
  },
  '/copyright': {
    title: '版权投诉',
    description: '提交版权和内容侵权投诉的说明。',
    sections: [
      {
        heading: '投诉材料',
        body: [
          '请提供权利证明、侵权链接、具体侵权内容、联系方式和真实性声明。',
          `投诉邮箱：${SITE_CONTACT.email}`,
        ],
      },
      {
        heading: '处理流程',
        body: ['我们会在核验后采取隐藏、删除、限制账号或恢复内容等措施，并保留处理记录。'],
      },
    ],
  },
  '/contact': {
    title: '联系我们',
    description: '徒步中国的运营、合作、版权和用户支持联系方式。',
    sections: [
      {
        heading: '联系方式',
        body: [
          `邮箱：${SITE_CONTACT.email}`,
          `电话：${SITE_CONTACT.phone}`,
          `地址：${SITE_CONTACT.address}`,
        ],
      },
      {
        heading: '用户支持',
        body: ['如需举报内容或反馈账号问题，请尽量附上页面链接、截图和操作时间。'],
      },
    ],
  },
};

const LegalPage = () => {
  const location = useLocation();
  const document = DOCUMENTS[location.pathname] || DOCUMENTS['/terms'];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <Seo title={document.title} description={document.description} path={location.pathname} type="article" />
      <p className="text-kicker uppercase text-ember-600">Trail China · Legal</p>
      <h1 className="mt-2 font-display text-xl text-ink md:text-h1">{document.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{document.description}</p>
      <div className="mt-10 space-y-8">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-lg text-ink">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-[1.9] text-foreground/80">
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
        {Object.entries(DOCUMENTS).map(([path, item]) => (
          <Link key={path} to={path} className="text-pine-700 hover:text-pine-800">
            {item.title}
          </Link>
        ))}
      </div>
      {SITE_CONTACT.icp && (
        <p className="mt-6 text-xs text-muted-foreground">{SITE_CONTACT.icp}</p>
      )}
    </div>
  );
};

export default LegalPage;
