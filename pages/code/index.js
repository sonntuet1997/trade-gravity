import Head from 'next/head'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import CustomButtonField from '../../components/button'
import { Row, Col } from 'antd'

export default function Home () {
  const { t } = useTranslation('common')

  return (
    <div className={''}>
      <Head>
        <title>Create Next App</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Row>
        <Col span={20}>
          <p>{t('content')}</p>
        </Col>

        <Col span={4}>
          <CustomButtonField

          >
            {t('button')}
          </CustomButtonField>
        </Col>
      </Row>
    </div>
  )
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common']))
  }
})
