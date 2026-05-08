import { TrueAdminFormPage, type TrueAdminFormPageProps } from './TrueAdminFormPage';

export type TrueAdminDetailPageProps = TrueAdminFormPageProps;

export function TrueAdminDetailPage({ className, ...props }: TrueAdminDetailPageProps) {
  return (
    <TrueAdminFormPage
      {...props}
      className={['trueadmin-detail-page', className].filter(Boolean).join(' ')}
    />
  );
}
