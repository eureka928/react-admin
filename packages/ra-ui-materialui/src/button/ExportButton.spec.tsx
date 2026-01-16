import * as React from 'react';
import { screen, render, waitFor, fireEvent } from '@testing-library/react';
import expect from 'expect';
import {
    CoreAdminContext,
    testDataProvider,
    ListContextProvider,
    RecordContextProvider,
    ResourceContextProvider,
} from 'ra-core';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { ExportButton } from './ExportButton';
import { ReferenceManyField } from '../field/ReferenceManyField';
import { ReferenceArrayField } from '../field/ReferenceArrayField';
import { TextField } from '../field/TextField';
import { Datagrid } from '../list/datagrid/Datagrid';

const theme = createTheme();

describe('<ExportButton />', () => {
    it('should invoke dataProvider with meta', async () => {
        const exporter = jest.fn().mockName('exporter');
        const dataProvider = testDataProvider({
            getList: jest.fn().mockResolvedValueOnce({ data: [], total: 0 }),
        });

        render(
            <CoreAdminContext dataProvider={dataProvider}>
                <ThemeProvider theme={theme}>
                    <ListContextProvider
                        value={
                            {
                                resource: 'test',
                                filterValues: { filters: 'override' },
                            } as any
                        }
                    >
                        <ExportButton
                            exporter={exporter}
                            meta={{ pass: 'meta' }}
                        />
                    </ListContextProvider>
                </ThemeProvider>
            </CoreAdminContext>
        );

        fireEvent.click(screen.getByLabelText('ra.action.export'));

        await waitFor(() => {
            expect(dataProvider.getList).toHaveBeenCalledWith('test', {
                filter: { filters: 'override' },
                pagination: { page: 1, perPage: 1000 },
                meta: { pass: 'meta' },
            });

            expect(exporter).toHaveBeenCalled();
        });
    });

    it('should use default exporter from ReferenceManyField context', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const getManyReference = jest.fn().mockResolvedValue({
            data: [
                { id: 1, title: 'Book 1' },
                { id: 2, title: 'Book 2' },
            ],
            total: 2,
        });
        const getList = jest.fn().mockResolvedValue({
            data: [
                { id: 1, title: 'Book 1' },
                { id: 2, title: 'Book 2' },
            ],
            total: 2,
        });
        const dataProvider = {
            getManyReference,
            getList,
            getOne: jest.fn().mockResolvedValue({ data: {} }),
            getMany: jest.fn().mockResolvedValue({ data: [] }),
            update: jest.fn().mockResolvedValue({ data: {} }),
            create: jest.fn().mockResolvedValue({ data: {} }),
            delete: jest.fn().mockResolvedValue({ data: {} }),
            updateMany: jest.fn().mockResolvedValue({ data: [] }),
            deleteMany: jest.fn().mockResolvedValue({ data: [] }),
        } as any;

        const record = { id: 1, name: 'Author' };

        render(
            <CoreAdminContext dataProvider={dataProvider}>
                <ThemeProvider theme={theme}>
                    <ResourceContextProvider value="authors">
                        <RecordContextProvider value={record}>
                            <ReferenceManyField
                                reference="books"
                                target="author_id"
                            >
                                <ExportButton />
                                <Datagrid bulkActionButtons={false}>
                                    <TextField source="title" />
                                </Datagrid>
                            </ReferenceManyField>
                        </RecordContextProvider>
                    </ResourceContextProvider>
                </ThemeProvider>
            </CoreAdminContext>
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Book 1')).not.toBeNull();
        });

        // The export button should be enabled (not disabled)
        const exportButton = screen.getByLabelText('ra.action.export');
        expect(exportButton).not.toBeDisabled();

        // Click the export button
        fireEvent.click(exportButton);

        // Verify that getList was called (ExportButton fetches data via getList)
        await waitFor(() => {
            expect(getList).toHaveBeenCalledWith(
                'books',
                expect.objectContaining({
                    pagination: { page: 1, perPage: 1000 },
                })
            );
        });
    });

    it('should use default exporter from ReferenceArrayField context', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const getMany = jest.fn().mockResolvedValue({
            data: [
                { id: 1, name: 'Artist 1' },
                { id: 2, name: 'Artist 2' },
            ],
        });
        const getList = jest.fn().mockResolvedValue({
            data: [
                { id: 1, name: 'Artist 1' },
                { id: 2, name: 'Artist 2' },
            ],
            total: 2,
        });
        const dataProvider = {
            getMany,
            getList,
            getManyReference: jest
                .fn()
                .mockResolvedValue({ data: [], total: 0 }),
            getOne: jest.fn().mockResolvedValue({ data: {} }),
            update: jest.fn().mockResolvedValue({ data: {} }),
            create: jest.fn().mockResolvedValue({ data: {} }),
            delete: jest.fn().mockResolvedValue({ data: {} }),
            updateMany: jest.fn().mockResolvedValue({ data: [] }),
            deleteMany: jest.fn().mockResolvedValue({ data: [] }),
        } as any;

        const record = { id: 1, name: 'Band', members: [1, 2] };

        render(
            <CoreAdminContext dataProvider={dataProvider}>
                <ThemeProvider theme={theme}>
                    <ResourceContextProvider value="bands">
                        <RecordContextProvider value={record}>
                            <ReferenceArrayField
                                source="members"
                                reference="artists"
                            >
                                <ExportButton />
                                <Datagrid bulkActionButtons={false}>
                                    <TextField source="name" />
                                </Datagrid>
                            </ReferenceArrayField>
                        </RecordContextProvider>
                    </ResourceContextProvider>
                </ThemeProvider>
            </CoreAdminContext>
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Artist 1')).not.toBeNull();
        });

        // The export button should be enabled (not disabled)
        const exportButton = screen.getByLabelText('ra.action.export');
        expect(exportButton).not.toBeDisabled();

        // Click the export button
        fireEvent.click(exportButton);

        // Verify that getList was called (ExportButton fetches data via getList)
        await waitFor(() => {
            expect(getList).toHaveBeenCalledWith(
                'artists',
                expect.objectContaining({
                    pagination: { page: 1, perPage: 1000 },
                })
            );
        });
    });
});
