'use client';

import {
  HelpCircle,
  Mail,
  BookOpen,
  FileText,
  MessageCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@d2d/ui';

interface HelpLink {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

const DOCUMENTATION_LINKS: HelpLink[] = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Learn the basics of Data2Decision',
    href: 'https://docs.data2decision.com/getting-started',
    external: true,
  },
  {
    icon: FileText,
    title: 'User Guide',
    description: 'Comprehensive documentation for all features',
    href: 'https://docs.data2decision.com/user-guide',
    external: true,
  },
  {
    icon: MessageCircle,
    title: 'API Reference',
    description: 'Technical documentation for developers',
    href: 'https://docs.data2decision.com/api',
    external: true,
  },
];

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How do I connect a new data source?',
    answer: 'Navigate to Connections in the sidebar and click "Add Connection". Follow the guided setup to connect your database, API, or file storage.',
  },
  {
    question: 'How do I invite team members to my organization?',
    answer: 'Go to Settings > Team and click "Invite Member". Enter their email address and select a role. They will receive an invitation email to join.',
  },
  {
    question: 'How do I create a new dashboard?',
    answer: 'From the Canvas, you can create widgets by describing what you want to see in natural language. Group related widgets together to form a dashboard.',
  },
  {
    question: 'What databases are supported?',
    answer: 'Data2Decision supports a wide range of databases including PostgreSQL, MySQL, MongoDB, ClickHouse, Snowflake, BigQuery, and many more. Check our documentation for the full list.',
  },
];

function HelpLinkCard({ link }: { link: HelpLink }) {
  const Icon = link.icon;

  return (
    <a
      href={link.href}
      target={link.external ? '_blank' : undefined}
      rel={link.external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-4 p-4 rounded-xl bg-[--color-fill-primary] border border-[--color-separator] hover:border-[--color-accent-blue]/50 hover:bg-[--color-accent-blue]/5 transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-[--color-accent-blue]/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[--color-accent-blue]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[--color-label-primary] group-hover:text-[--color-accent-blue] transition-colors">
          {link.title}
        </p>
        <p className="text-xs text-[--color-label-tertiary] mt-0.5">
          {link.description}
        </p>
      </div>
      {link.external ? (
        <ExternalLink className="w-4 h-4 text-[--color-label-tertiary] group-hover:text-[--color-accent-blue] transition-colors shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-[--color-label-tertiary] group-hover:text-[--color-accent-blue] transition-colors shrink-0" />
      )}
    </a>
  );
}

function FAQItemCard({ item }: { item: FAQItem }) {
  return (
    <div className="p-4 rounded-xl bg-[--color-fill-primary] border border-[--color-separator]">
      <p className="text-sm font-medium text-[--color-label-primary]">
        {item.question}
      </p>
      <p className="text-sm text-[--color-label-secondary] mt-2">
        {item.answer}
      </p>
    </div>
  );
}

export default function HelpSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Contact Support */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Support
          </CardTitle>
          <CardDescription>
            Get in touch with our support team
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="p-4 rounded-xl bg-[--color-accent-blue]/5 border border-[--color-accent-blue]/20">
            <p className="text-sm text-[--color-label-primary]">
              Have a question or need help? Our support team is here to assist you.
            </p>
            <a
              href="mailto:support@data2decision.com"
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-[--color-accent-blue] hover:underline"
            >
              <Mail className="w-4 h-4" />
              support@data2decision.com
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Documentation
          </CardTitle>
          <CardDescription>
            Learn how to use Data2Decision
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {DOCUMENTATION_LINKS.map((link) => (
              <HelpLinkCard key={link.title} link={link} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Common questions and answers
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FAQItemCard key={item.question} item={item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
