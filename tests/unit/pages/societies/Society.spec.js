import { RouterLinkStub } from '@vue/test-utils'
import { expect } from 'chai'

import Society from '@/pages/society/_slug/index'
import {
  generateMountOptions,
  mountWithRouterMock,
  waitFor,
} from '../../helpers'
import FakeSociety from '../../fixtures/Society'
import GenericApolloResponse from '../../fixtures/support/GenericApolloResponse'
import GenericNodeConnection from '../../fixtures/support/GenericNodeConnection'
import Production from '../../fixtures/Production'

describe('Society page', function () {
  let societyPageComponent

  beforeEach(async () => {
    societyPageComponent = await mountWithRouterMock(
      Society,
      generateMountOptions(['apollo'], {
        apollo: {
          queryCallstack: [
            GenericApolloResponse(
              'society',
              FakeSociety({
                productions: GenericNodeConnection([
                  Production({
                    name: 'Bins',
                    slug: 'bins',
                    isBookable: true,
                    end: '2020-10-18T00:00:00',
                  }),
                  Production({
                    name: 'Centuary',
                    slug: 'centuary',
                    isBookable: false,
                    end: '2019-10-19T00:00:00',
                  }),
                ]),
              })
            ),
          ],
        },
      }),
      {
        params: {
          slug: 'sta',
        },
      }
    )
  })

  it('fetches the society', async () => {
    await waitFor(() => societyPageComponent.vm.society)
    expect(societyPageComponent.vm.society.name).to.eq('STA')

    expect(societyPageComponent.text()).to.contain('STA')

    expect(societyPageComponent.text()).to.contain('We do it in the dark')

    expect(
      societyPageComponent
        .findComponent({
          ref: 'society-logo',
        })
        .attributes('src')
    ).to.equal('http://pathto.example/logo-image.png')
  })

  it('shows society splashscreen', async () => {
    await waitFor(() => societyPageComponent.vm.society)
    const splashscreenContainer = societyPageComponent.findComponent({
      ref: 'banner',
    })

    expect(splashscreenContainer.attributes('style')).to.contain(
      'background-image: url(http://pathto.example/society-banner.png)'
    )
  })

  describe('society production list', () => {
    let links
    let tableRows
    beforeEach(() => {
      tableRows = societyPageComponent.findAll('tr')
      links = societyPageComponent.findAllComponents(RouterLinkStub)
    })

    it('correct number of productions', () => {
      expect(tableRows.length).to.equal(2)
      expect(links.length).to.equal(3)
    })

    it('table rows have correct text', () => {
      expect(tableRows.at(0).text()).to.contain('Bins')
      expect(tableRows.at(0).text()).to.contain('Book Now')

      expect(tableRows.at(1).text()).to.contain('Centuary')
      expect(tableRows.at(1).text()).to.contain('October 2019')
    })

    it('has correct links', () => {
      expect(links.at(0).props('to')).to.equal('/production/bins')
      expect(links.at(1).props('to')).to.equal('/production/bins/book')
      expect(links.at(2).props('to')).to.equal('/production/centuary')
    })
  })

  it('handles invalid society', async () => {
    const errorFn = jest.fn()
    societyPageComponent = await mountWithRouterMock(
      Society,
      generateMountOptions(['apollo'], {
        apollo: {
          queryCallstack: [GenericApolloResponse('society')],
        },
      }),
      {
        error: errorFn,
        params: {
          slug: 'not-drama-soc',
        },
      }
    )
    await waitFor(() => errorFn.mock.calls.length)
    expect(errorFn.mock.calls.length).to.eq(1)
    expect(errorFn.mock.calls[0][0]).to.include({ statusCode: 404 })
  })
})
