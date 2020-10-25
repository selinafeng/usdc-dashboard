import {
  fireEvent,
  render,
} from '@testing-library/vue';
import Table from '@/components/Table.vue';
import Vue from 'vue';
import VueMaterial from 'vue-material';

Vue.use(VueMaterial);

const testProps = {
  name: 'Test Name',
  totalItems: 300,
  schema: [{
    name: 'A',
    getter: (i) => i.a,
  },
  {
    name: 'B',
    getter: (i) => i.b,
  },
  ],
  keyField: 'B',
  content: [{
    a: 'Row 1 A',
    b: 'Row 1 B',
  },
  {
    a: 'Row 2 A',
    b: 'Row 2 B',
  },
  ],
};

const testPropsLinks = {
  name: 'Test Name',
  totalItems: 30,
  schema: [{
    name: 'A',
    getter: (i) => i.a,
    link: () => '/a-link',
  },
  {
    name: 'B',
    getter: (i) => i.b,
  },
  ],
  keyField: 'B',
  content: [{
    a: 'Row 1 A',
    b: 'Row 1 B',
  },
  {
    a: 'Row 2 A',
    b: 'Row 2 B',
  },
  ],
};

const testPropsLarge = {
  name: 'Test Name',
  totalItems: 30,
  schema: [{
    name: 'A',
    getter: (i) => i.a,
  },
  {
    name: 'B',
    getter: (i) => i.b,
  },
  ],
  keyField: 'B',
  content: [],
};

for (let i = 1; i <= 30; i++) {
  testPropsLarge.content.push({
    a: `Row ${i} A`,
    b: `Row ${i} B`,
  });
}

describe('Loading bar', () => {
  it('Loading bar renders if table has not loaded yet', () => {
    const {
      getByTestId,
    } = render(Table, {
      props: {
        ...testProps,
        loading: true,
      },
      stubs: {
        NuxtLink: true,
      },
    });
    expect(getByTestId('progress-bar-test-id')).not.toBeNull();
  });
  it('Loading bar disappears after table renders', () => {
    const {
      queryByTestId,
    } = render(Table, {
      props: {
        ...testProps,
        loading: false,
      },
      stubs: {
        NuxtLink: true,
      },
    });

    expect(queryByTestId('progress-bar-test-id')).toBeNull();
  });

});

describe('Table', () => {
  it('Renders labels correctly', () => {
    const {
      getByText,
    } = render(Table, {
      props: testProps,
      stubs: {
        NuxtLink: true,
      },
    });

    expect(getByText('A')).not.toBeNull();
    expect(getByText('B')).not.toBeNull();
  });

  it('Renders entries correctly', async () => {
    const {
      getByText,
    } = render(Table, {
      props: testProps,
      stubs: {
        NuxtLink: true,
      },
    });

    expect(getByText('Row 1 A')).not.toBeNull();
    expect(getByText('Row 1 B')).not.toBeNull();
    expect(getByText('Row 2 A')).not.toBeNull();
    expect(getByText('Row 2 B')).not.toBeNull();
  });

  it('Renders links correctly', async () => {
    const {
      getByText,
    } = render(Table, {
      props: testPropsLinks,
      stubs: {
        NuxtLink: true,
      },
    });

    const a1 = getByText('Row 1 A');
    const b1 = getByText('Row 1 B');
    const a2 = getByText('Row 2 A');
    const b2 = getByText('Row 2 B');

    expect(a1.tagName).toBe('NUXTLINK-STUB');
    expect(a2.tagName).toBe('NUXTLINK-STUB');
    expect(a1.getAttribute('to')).toBe('/a-link');
    expect(a2.getAttribute('to')).toBe('/a-link');

    expect(b1.tagName).not.toBe('NUXTLINK-STUB');
    expect(b2.tagName).not.toBe('NUXTLINK-STUB');
  });

  it('Pagination functionality', async () => {
    const {
      getByText,
    } = render(Table, {
      props: testPropsLarge,
      stubs: {
        NuxtLink: true,
      },
    });

    expect(getByText('Row 1 A')).not.toBeNull();
    expect(getByText('Row 1 B')).not.toBeNull();
    expect(getByText('Row 25 A')).not.toBeNull();
    expect(getByText('Row 25 B')).not.toBeNull();

    await fireEvent.click(getByText('navigate_next'));

    expect(getByText('Page 2 of 2')).not.toBeNull();
    expect(getByText('Row 26 A')).not.toBeNull();
    expect(getByText('Row 26 B')).not.toBeNull();
    expect(getByText('Row 30 A')).not.toBeNull();
    expect(getByText('Row 30 B')).not.toBeNull();
  });
});
