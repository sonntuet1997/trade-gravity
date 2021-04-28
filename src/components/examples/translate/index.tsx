import React from 'react'
import { TFunction } from 'next-i18next'

import { withTranslation, i18n } from '@i18n'

/**
 * This component is generated as en example usage of next-i18next
 *
 * To learn more about next-i18next and i18n
 * please visit https://github.com/isaachinman/next-i18next
 */

const I18NExampleComponent: React.FC<{ t: TFunction }> = ({ t }) => {
  const changeLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ja' ? 'en' : 'ja')
  }
  return (
    <div>
      <header>
        <h2>{t`home:title`}</h2>
        <div>
          <button onClick={changeLanguage}>{t(`common:language.en`)}</button>
          <button onClick={changeLanguage}>{t(`common:language.ja`)}</button>
        </div>
      </header>
      <main>
        <p>{t('common:greet', { name: t`common:world` })}</p>
        <p>{t`home:someText`}</p>
      </main>
    </div>
  )
}

export const I18NExample = withTranslation(['common', 'home'])(
  I18NExampleComponent
)
