import { mount } from '@vue/test-utils'
import { expect } from 'chai'

import PaginationBar from '@/components/ui/PaginationBar.vue'

describe('Pagination Bar', () => {
  let component
  beforeEach(() => {
    component = mount(PaginationBar, {
      propsData: {
        numberOfPages: 5,
        currentPage: 5,
        numberPagesToDisplay: 5,
      },
    })
  })

  it('displays pages correctly when it can fit all pages', async () => {
    assertPagesInOrder([1, 2, 3, 4, 5])

    await setProps(null, 2, null)
    assertPagesInOrder([1, 2, 3, 4, 5])

    await setProps(null, 1, null)
    assertPagesInOrder([1, 2, 3, 4, 5])

    await setProps(null, 3, null)
    assertPagesInOrder([1, 2, 3, 4, 5])

    await setProps(1, 1, null)
    expect(component.html()).to.eq('')

    await setProps(2, 1, null)
    assertPagesInOrder([1, 2])
  })

  it('truncates when required', async () => {
    await setProps(10, 2, null)
    assertPagesInOrder([1, 2, 3, '...', 10])

    await setProps(null, 8, null)
    assertPagesInOrder([1, '...', 8, 9, 10])

    await setProps(null, 5, null)
    assertPagesInOrder([1, '...', 5, '...', 10])

    await setProps(null, null, 7)
    assertPagesInOrder([1, '...', 4, 5, 6, '...', 10])
  })

  it('sends goto page event', async () => {
    const page4Button = component.find('button:nth-of-type(5)') // +1 due to backwards button
    const page5Button = component.find('button:nth-of-type(6)') // +1 due to backwards button
    expect(page4Button.text()).eq('4')

    await page4Button.trigger('click')

    expect(component.emitted('gotoPage').length).to.eq(1)
    expect(component.emitted('gotoPage')[0][0]).to.eq(4)

    await page5Button.trigger('click')

    expect(component.emitted('gotoPage').length).to.eq(1) // Clicking current page should do nothing

    await setProps(10, 5, null)
    const truncatedButton = component.find('button:nth-of-type(3)') // +1 due to backwards button
    await truncatedButton.trigger('click')
    expect(component.emitted('gotoPage').length).to.eq(1) // Clicking current page should do nothing
  })

  it('sends previous page event', async () => {
    const previousButton = component.find('button:nth-of-type(1)')

    await previousButton.trigger('click')
    expect(component.emitted('previousPage').length).to.eq(1)

    await setProps(null, 1, null)

    await previousButton.trigger('click')
    expect(component.emitted('previousPage').length).to.eq(1) // Clicking back should do nothing if on first page
  })

  it('sends next page event', async () => {
    const nextButton = component.find('button:last-of-type')

    await nextButton.trigger('click')
    expect(component.emitted('nextPage')).to.not.be.ok // We are on page 5/5, so shouldn't be able to go forward

    await setProps(null, 4, null)

    await nextButton.trigger('click')
    expect(component.emitted('nextPage').length).to.eq(1)
  })

  const setProps = async (
    numPages = null,
    currentPage = null,
    numToDisplay = null
  ) => {
    const updateObj = {}
    if (numPages) updateObj.numberOfPages = numPages
    if (currentPage) updateObj.currentPage = currentPage
    if (numToDisplay) updateObj.numberPagesToDisplay = numToDisplay
    await component.setProps(updateObj)
  }

  const assertPagesInOrder = (expectedOrder) => {
    const buttons = component.findAll(
      'button:not(:first-of-type):not(:last-of-type)'
    ) // First and last are back / forwards
    let i = 0
    buttons.wrappers.forEach((button, index) => {
      i++
      expect(button.text()).to.eq(expectedOrder[index].toString())
    })
    expect(i).to.eq(buttons.length) // Gross error check for assertion
    expect(i).to.eq(component.findAll('button').length - 2) // Gross error check for checking all the page buttons
  }
})
