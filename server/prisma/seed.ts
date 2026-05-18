import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@salesai.com' },
    update: {},
    create: {
      email: 'demo@salesai.com',
      passwordHash,
      name: 'Alex Johnson',
    },
  })

  // Delete existing data for clean seed
  await prisma.activity.deleteMany({ where: { lead: { userId: user.id } } })
  await prisma.lead.deleteMany({ where: { userId: user.id } })
  await prisma.emailTemplate.deleteMany({ where: { userId: user.id } })

  const leadsData = [
    // Prospecting (3)
    {
      name: 'Sarah Chen',
      company: 'Nexus Analytics',
      email: 'sarah.chen@nexusanalytics.com',
      phone: '+1-415-555-0101',
      title: 'VP of Operations',
      source: 'LinkedIn',
      stage: 'Prospecting',
      score: 72,
      scoreInsight: 'High-value target: VP role with budget authority, active LinkedIn, company recently raised Series B',
      value: 45000,
      notes: 'Nexus Analytics just raised $12M Series B. Sarah posted about scaling ops challenges. Perfect fit for our automation suite.',
      activities: [
        { type: 'note', summary: 'Found via LinkedIn - VP Operations at Nexus. Commented on automation post.' },
        { type: 'email', summary: 'Sent initial connection request on LinkedIn with personalized message about ops scaling.' },
        { type: 'ai', summary: 'AI drafted cold email focusing on Series B scaling challenges and ROI metrics.' },
      ],
    },
    {
      name: 'Marcus Rivera',
      company: 'TechFlow Solutions',
      email: 'marcus.r@techflowsolutions.io',
      phone: '+1-512-555-0234',
      title: 'Head of Sales',
      source: 'Referral',
      stage: 'Prospecting',
      score: 58,
      scoreInsight: 'Warm referral from existing customer. Mid-tier deal but high conversion probability given source.',
      value: 28000,
      notes: 'Referred by David Kim at CloudPeak. Marcus mentioned frustration with current CRM during informal chat.',
      activities: [
        { type: 'call', summary: 'Brief intro call - 8 min. Marcus is evaluating options. Agreed to a demo next week.' },
        { type: 'email', summary: 'Sent calendar invite for product demo with pre-read materials.' },
      ],
    },
    {
      name: 'Jennifer Walsh',
      company: 'Pinnacle Retail Group',
      email: 'jwalsh@pinnacleretail.com',
      phone: '+1-212-555-0378',
      title: 'Director of Digital Transformation',
      source: 'Conference',
      stage: 'Prospecting',
      score: 41,
      scoreInsight: 'Met at retail tech conference. Interest level moderate. Large company but long sales cycle expected.',
      value: 85000,
      notes: 'Met at RetailTech Summit. Pinnacle is going through digital transformation. Budget discussions happening in Q1.',
      activities: [
        { type: 'note', summary: 'Met at RetailTech Summit booth. Exchanged cards. Interest in AI-powered analytics.' },
        { type: 'email', summary: 'Post-conference follow-up email with case study from similar retail client.' },
        { type: 'note', summary: 'Jennifer OOO until next week per auto-responder.' },
      ],
    },
    // Qualified (3)
    {
      name: 'David Park',
      company: 'Meridian Software',
      email: 'dpark@meridiansoftware.com',
      phone: '+1-650-555-0456',
      title: 'CTO',
      source: 'Inbound',
      stage: 'Qualified',
      score: 81,
      scoreInsight: 'CTO inbound lead with clear budget ($120K approved). Technical decision maker. High urgency - competitor contract expiring.',
      value: 120000,
      notes: 'Reached out via website. Current contract with Salesforce expires March 31. Looking to consolidate CRM + AI tools. Budget pre-approved.',
      activities: [
        { type: 'email', summary: 'Inbound inquiry - asked for enterprise pricing and API documentation.' },
        { type: 'call', summary: '45-min discovery call. Confirmed $120K budget, Q1 timeline. Salesforce pain: too complex, no AI.' },
        { type: 'meeting', summary: 'Technical deep-dive with their engineering team. API capabilities well-received.' },
        { type: 'ai', summary: 'AI analyzed deal: high urgency due to contract expiry, recommend accelerating proposal.' },
      ],
    },
    {
      name: 'Amanda Foster',
      company: 'Brightside Capital',
      email: 'afoster@brightsidecap.com',
      phone: '+1-312-555-0589',
      title: 'Managing Director',
      source: 'LinkedIn',
      stage: 'Qualified',
      score: 76,
      scoreInsight: 'Financial services firm with compliance needs. MD-level sponsor. Strong fit for enterprise tier.',
      value: 95000,
      notes: 'Brightside Capital manages $2B AUM. Amanda is spearheading digital ops initiative. Compliance team needs audit trails which we provide natively.',
      activities: [
        { type: 'email', summary: 'Cold outreach highlighting fintech compliance features. Immediate positive response.' },
        { type: 'call', summary: '30-min qualifying call. 4-person team, compliance-heavy requirements. We check all boxes.' },
        { type: 'meeting', summary: 'In-person meeting at their Chicago office. Demo went very well. Wants proposal.' },
        { type: 'note', summary: 'Amanda mentioned 2 competing bids but we have advantage on compliance features.' },
      ],
    },
    {
      name: 'Robert Chang',
      company: 'Apex Manufacturing',
      email: 'rchang@apexmfg.com',
      phone: '+1-216-555-0712',
      title: 'VP Business Development',
      source: 'Trade Show',
      stage: 'Qualified',
      score: 63,
      scoreInsight: 'Manufacturing sector, steady interest. Decision committee involved adds friction. Value prop around distributor relationship management.',
      value: 52000,
      notes: 'Met at ManufacturingExpo. Apex has 200+ distributor relationships to manage. Our partner portal could be transformative for them.',
      activities: [
        { type: 'note', summary: 'Trade show demo - Robert very engaged with distributor portal features.' },
        { type: 'email', summary: 'Sent ROI calculator customized for manufacturing distributor management.' },
        { type: 'call', summary: 'Discovery call with Robert + IT Director. Budget TBD, needs committee approval.' },
      ],
    },
    // Proposal (3)
    {
      name: 'Lisa Thornton',
      company: 'Quantum Health Systems',
      email: 'l.thornton@quantumhealth.org',
      phone: '+1-617-555-0834',
      title: 'Chief Revenue Officer',
      source: 'Referral',
      stage: 'Proposal',
      score: 88,
      scoreInsight: 'CRO-level champion, strong referral, healthcare vertical with compliance alignment. Proposal submitted, awaiting board approval.',
      value: 110000,
      notes: 'Referred by Tom Bradley (existing client). Lisa oversees 50-rep sales team. Wants to standardize on AI-powered CRM across all divisions.',
      activities: [
        { type: 'call', summary: 'Intro call via Tom Bradley referral. Immediate chemistry. Lisa knows exactly what she wants.' },
        { type: 'meeting', summary: 'Full team presentation to 8 stakeholders. Standing ovation for AI email drafting demo.' },
        { type: 'email', summary: 'Sent formal proposal: $110K annual, includes onboarding + dedicated CSM.' },
        { type: 'ai', summary: 'AI next action: Follow up with ROI analysis specific to healthcare sales cycles.' },
        { type: 'note', summary: 'Lisa confirmed proposal is in board review. Decision expected within 2 weeks.' },
      ],
    },
    {
      name: 'Carlos Mendez',
      company: 'Vanguard Logistics',
      email: 'cmendez@vanguardlog.com',
      phone: '+1-305-555-0967',
      title: 'SVP Sales & Marketing',
      source: 'Cold Outreach',
      stage: 'Proposal',
      score: 79,
      scoreInsight: 'SVP champion, logistics vertical with fleet of 80 reps. Custom proposal for territory management feature.',
      value: 78000,
      notes: 'Cold email breakthrough - Carlos personally responded within 2 hours. Vanguard has 80 reps across 12 regions. Territory conflict resolution was the key pain.',
      activities: [
        { type: 'email', summary: 'AI-drafted cold email about territory management. 2-hour response from Carlos himself.' },
        { type: 'call', summary: '1-hour detailed discovery. Territory management + commission tracking are must-haves.' },
        { type: 'meeting', summary: 'Custom demo tailored for logistics. Territory map integration shown. Carlos loved it.' },
        { type: 'email', summary: 'Custom proposal sent: $78K with territory management module + API integration.' },
      ],
    },
    {
      name: 'Emily Nakamura',
      company: 'Sterling Properties',
      email: 'enakamura@sterlingprop.com',
      phone: '+1-310-555-1089',
      title: 'Director of Sales Operations',
      source: 'Inbound',
      stage: 'Proposal',
      score: 71,
      scoreInsight: 'Real estate vertical with recurring revenue model. Proposal under legal review. Minor friction on data migration.',
      value: 62000,
      notes: 'Sterling manages 500+ commercial properties. Emily wants to centralize all broker relationships in one AI-powered system.',
      activities: [
        { type: 'email', summary: 'Inbound from website pricing page. Interested in broker relationship management.' },
        { type: 'call', summary: 'Demo call - great fit. Concerned about migrating 3 years of HubSpot data.' },
        { type: 'note', summary: 'Addressed data migration concern - offered white-glove migration service.' },
        { type: 'email', summary: 'Proposal sent with migration package included. Under legal review.' },
      ],
    },
    // Closing (3)
    {
      name: 'Thomas Bradley',
      company: 'CloudPeak Technologies',
      email: 'tbradley@cloudpeak.tech',
      phone: '+1-206-555-1112',
      title: 'CEO',
      source: 'Inbound',
      stage: 'Closing',
      score: 94,
      scoreInsight: 'CEO champion, verbal commitment received, contract in legal. Exceptional deal - could become reference customer.',
      value: 95000,
      notes: 'CEO who found us via TechCrunch article. CloudPeak is growing 200% YoY. Thomas wants AI-native CRM from day one. Verbal yes received.',
      activities: [
        { type: 'call', summary: 'CEO-to-CEO level call. Thomas is sold on vision. Just needs legal review.' },
        { type: 'meeting', summary: 'Contract review call with Thomas + General Counsel. 2 minor redlines, easily resolved.' },
        { type: 'email', summary: 'Revised contract sent with agreed amendments. Awaiting signature.' },
        { type: 'ai', summary: 'AI summary: Deal is 95% closed. Risk: GC is slow. Action: offer DocuSign for speed.' },
        { type: 'note', summary: 'Thomas confirmed signing by end of week. Reference customer agreement verbal yes.' },
      ],
    },
    {
      name: 'Rachel Goldstein',
      company: 'Momentum Ventures',
      email: 'rgoldstein@momentumvc.com',
      phone: '+1-628-555-1245',
      title: 'Partner',
      source: 'Referral',
      stage: 'Closing',
      score: 91,
      scoreInsight: 'VC Partner managing portfolio CRM needs. Referred by 3 portfolio companies already using us. Contract review stage.',
      value: 68000,
      notes: 'Rachel manages a portfolio of 35 companies. Wants enterprise license for all portfolio companies. $68K is conservative - upsell potential to $200K+.',
      activities: [
        { type: 'note', summary: 'Three portfolio founders independently recommended us to Rachel.' },
        { type: 'call', summary: 'Strategic call - enterprise portfolio licensing discussion. Huge expansion potential.' },
        { type: 'meeting', summary: 'Term sheet presented: $68K base + per-portfolio-company pricing. Loved the model.' },
        { type: 'email', summary: 'Final contract sent. Rachel said she will sign Monday.' },
        { type: 'ai', summary: 'AI: Protect this deal. Offer dedicated implementation support to ensure fast signature.' },
      ],
    },
    {
      name: "Kevin O'Brien",
      company: 'Atlas Energy Corp',
      email: 'kobrien@atlascorp.com',
      phone: '+1-713-555-1378',
      title: 'SVP of Commercial Sales',
      source: 'LinkedIn',
      stage: 'Closing',
      score: 87,
      scoreInsight: 'Energy sector SVP, large deal value, procurement in final stages. Key risk: internal budget freeze rumors.',
      value: 108000,
      notes: 'Atlas Energy is restructuring commercial sales team of 120 reps. Kevin is championing new CRM as part of transformation. IT sign-off received.',
      activities: [
        { type: 'email', summary: 'LinkedIn outreach about energy sector sales transformation. Kevin engaged immediately.' },
        { type: 'call', summary: '2-hour deep discovery with Kevin + Sales Operations team. Full requirements gathered.' },
        { type: 'meeting', summary: 'Executive presentation to C-suite. CFO asked tough ROI questions - nailed it.' },
        { type: 'note', summary: 'IT security review passed. Procurement process initiated.' },
        { type: 'email', summary: 'PO request sent to procurement. Kevin says budget freeze rumors are false - deal is on.' },
      ],
    },
  ]

  for (const leadData of leadsData) {
    const { activities, ...leadFields } = leadData
    const lead = await prisma.lead.create({
      data: {
        ...leadFields,
        userId: user.id,
      },
    })

    for (const activity of activities) {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: activity.type,
          summary: activity.summary,
        },
      })
    }
  }

  // Email Templates
  await prisma.emailTemplate.createMany({
    data: [
      {
        name: 'Cold Outreach - Value First',
        subject: "Quick question about {company}'s sales process",
        body: `Hi {name},

I noticed {company} is {personalization_hook}.

I work with companies like yours to help their sales teams close deals 40% faster using AI-powered CRM automation.

Would it make sense to have a 15-minute call this week to see if we could deliver similar results for {company}?

Best,
{sender_name}`,
        userId: user.id,
      },
      {
        name: 'Follow-Up - After No Response',
        subject: "Re: Quick question about {company}'s sales process",
        body: `Hi {name},

I wanted to follow up on my previous email.

I completely understand if the timing isn't right. However, given that {pain_point}, I thought this might be worth a quick look.

I put together a 2-minute overview specifically for {company}: {link}

Happy to connect whenever the timing works better for you.

Best,
{sender_name}`,
        userId: user.id,
      },
      {
        name: 'Proposal Follow-Up',
        subject: 'Following up on {company} proposal + quick question',
        body: `Hi {name},

I wanted to check in on the proposal I sent over last week.

A few clients in {industry} have asked about {common_question} — I put together a quick answer that might be helpful for your evaluation: {link}

Is there anything specific holding things up that I can help address?

Looking forward to moving forward together.

Best,
{sender_name}`,
        userId: user.id,
      },
    ],
  })

  console.log('Seed completed successfully!')
  console.log(`Demo user: demo@salesai.com / demo1234`)
  console.log(`Created ${leadsData.length} leads with activities`)
  console.log('Created 3 email templates')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
