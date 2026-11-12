// Port of Angular FooterComponent (src/app/components/footer/footer.component.*).
// Scroll handling mutates the DOM directly via refs (as Angular does) so that
// scrolling never triggers React re-renders.
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './Footer.module.scss'

export function Footer() {
  const { pathname } = useLocation()
  const disableBackToTopBtn = pathname.includes('weekly')
  const footerRef = useRef<HTMLElement>(null)
  const backToTopRef = useRef<HTMLDivElement>(null)
  const prevScrollPos = useRef(window.pageYOffset)
  const disableRef = useRef(disableBackToTopBtn)

  useEffect(() => {
    disableRef.current = disableBackToTopBtn
  }, [disableBackToTopBtn])

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      const isReachBottom = document.body.scrollHeight === window.scrollY + window.innerHeight
      const backToTop = backToTopRef.current
      if (!backToTop) return
      if (!isReachBottom) backToTop.setAttribute('style', 'visibility:hidden')
    })
    resizeObserver.observe(document.body)

    const onScroll = () => {
      const backToTop = backToTopRef.current
      const footer = footerRef.current
      const currentScrollPos = window.pageYOffset
      const isReachBottom = document.body.scrollHeight === window.scrollY + window.innerHeight

      if (footer) {
        if (currentScrollPos === 0 || prevScrollPos.current > currentScrollPos) {
          footer.classList.remove('footer-hidden')
          footer.setAttribute('style', 'visibility:visible')
        } else {
          footer.classList.add('footer-hidden')
          footer.setAttribute('style', 'visibility:hidden')
        }
      }

      // Early returns intentionally skip updating prevScrollPos, mirroring Angular.
      if (disableRef.current) return
      if (isReachBottom) {
        backToTop?.setAttribute('style', 'visibility:visible')
        return
      }
      if (backToTop) {
        backToTop.setAttribute('style', 'visibility:hidden')
        const scrollingDown = window.pageYOffset >= 0 && prevScrollPos.current <= currentScrollPos
        if (!scrollingDown && window.pageYOffset !== 0) {
          backToTop.setAttribute('style', 'visibility:visible')
        }
      }
      prevScrollPos.current = currentScrollPos
    }
    window.addEventListener('scroll', onScroll)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const goToTop = () => {
    setTimeout(() => {
      backToTopRef.current?.setAttribute('style', 'display:none')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 10)
  }

  return (
    <>
      <footer ref={footerRef} className={`${styles.footer} ${styles.stickToBottom}`} id="footer">
        <img src="/assets/images/Wiq_logo_sRGB.png" alt="" />
        <div className={styles.copyrightText}>
          © Woolworths Ltd - Confidential information restricted to authorised users only.
        </div>
      </footer>
      <div
        ref={backToTopRef}
        className={styles.btnBackToTop}
        id="btnBackToTop"
        onClick={goToTop}
        hidden={disableBackToTopBtn}
      >
        <span>Back to top</span>
        <span className="material-icons">keyboard_arrow_up</span>
      </div>
    </>
  )
}
