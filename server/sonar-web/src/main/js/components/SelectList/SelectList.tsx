/*
 * SonarQube
 * Copyright (C) 2009-2019 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import * as React from 'react';
import { translate } from 'sonar-ui-common/helpers/l10n';
import SearchBox from 'sonar-ui-common/components/controls/SearchBox';
import RadioToggle from 'sonar-ui-common/components/controls/RadioToggle';
import ListFooter from 'sonar-ui-common/components/controls/ListFooter';
import SelectListListContainer from './SelectListListContainer';
import './styles.css';

export enum Filter {
  All = 'all',
  Selected = 'selected',
  Unselected = 'deselected'
}

interface Props {
  allowBulkSelection?: boolean;
  elements: string[];
  elementsTotalCount?: number;
  disabledElements?: string[];
  labelSelected?: string;
  labelUnselected?: string;
  labelAll?: string;
  needToReload?: boolean;
  onSearch: (searchParams: SelectListSearchParams) => Promise<void>;
  onSelect: (element: string) => Promise<void>;
  onUnselect: (element: string) => Promise<void>;
  pageSize?: number;
  readOnly?: boolean;
  renderElement: (element: string) => React.ReactNode;
  selectedElements: string[];
  withPaging?: boolean;
}

export interface SelectListSearchParams {
  filter: Filter;
  page?: number;
  pageSize?: number;
  query: string;
}

interface State {
  lastSearchParams: SelectListSearchParams;
  loading: boolean;
}

const DEFAULT_PAGE_SIZE = 100;

export default class SelectList extends React.PureComponent<Props, State> {
  mounted = false;

  constructor(props: Props) {
    super(props);

    this.state = {
      lastSearchParams: {
        filter: Filter.Selected,
        page: 1,
        pageSize: props.pageSize ? props.pageSize : DEFAULT_PAGE_SIZE,
        query: ''
      },
      loading: false
    };
  }

  componentDidMount() {
    this.mounted = true;
    this.search({});
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  getFilter = () =>
    this.state.lastSearchParams.query === '' ? this.state.lastSearchParams.filter : Filter.All;

  search = (searchParams: Partial<SelectListSearchParams>) =>
    this.setState(
      prevState => ({
        loading: true,
        lastSearchParams: { ...prevState.lastSearchParams, ...searchParams }
      }),
      () =>
        this.props
          .onSearch({
            filter: this.getFilter(),
            page: this.props.withPaging ? this.state.lastSearchParams.page : undefined,
            pageSize: this.props.withPaging ? this.state.lastSearchParams.pageSize : undefined,
            query: this.state.lastSearchParams.query
          })
          .finally(() => {
            if (this.mounted) {
              this.setState({ loading: false });
            }
          })
    );

  changeFilter = (filter: Filter) => this.search({ filter, page: 1 });

  handleQueryChange = (query: string) => this.search({ page: 1, query });

  onLoadMore = () =>
    this.search({
      page:
        this.state.lastSearchParams.page != null ? this.state.lastSearchParams.page + 1 : undefined
    });

  onReload = () => this.search({ page: 1 });

  render() {
    const {
      labelSelected = translate('selected'),
      labelUnselected = translate('unselected'),
      labelAll = translate('all')
    } = this.props;
    const { filter } = this.state.lastSearchParams;

    const disabled = this.state.lastSearchParams.query !== '';

    return (
      <div className="select-list">
        <div className="display-flex-center">
          <RadioToggle
            className="spacer-right"
            name="filter"
            onCheck={this.changeFilter}
            options={[
              { disabled, label: labelSelected, value: Filter.Selected },
              { disabled, label: labelUnselected, value: Filter.Unselected },
              { disabled, label: labelAll, value: Filter.All }
            ]}
            value={filter}
          />
          <SearchBox
            autoFocus={true}
            loading={this.state.loading}
            onChange={this.handleQueryChange}
            placeholder={translate('search_verb')}
            value={this.state.lastSearchParams.query}
          />
        </div>
        <SelectListListContainer
          allowBulkSelection={this.props.allowBulkSelection}
          disabledElements={this.props.disabledElements || []}
          elements={this.props.elements}
          filter={this.getFilter()}
          onSelect={this.props.onSelect}
          onUnselect={this.props.onUnselect}
          readOnly={this.props.readOnly}
          renderElement={this.props.renderElement}
          selectedElements={this.props.selectedElements}
        />
        {!!this.props.elementsTotalCount && (
          <ListFooter
            count={this.props.elements.length}
            loadMore={this.onLoadMore}
            needReload={this.props.needToReload}
            reload={this.onReload}
            total={this.props.elementsTotalCount}
          />
        )}
      </div>
    );
  }
}
