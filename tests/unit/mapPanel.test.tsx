import { fireEvent, render, screen } from '@testing-library/react-native';
import { MapPanel, type MapPoint } from '../../src/components/MapPanel';

const point: MapPoint = {
  id: 'journey-1',
  latitude: 13.0827,
  longitude: 80.2707,
  accuracyM: 25,
  title: '<img src=x onerror=alert(1)>',
  description: 'Updated just now',
  freshness: 'fresh',
};

describe('MapPanel', () => {
  test('renders an in-app OpenStreetMap view without a Google Maps key', async () => {
    await render(<MapPanel points={[point]} />);

    const map = screen.getByTestId('in-app-map');
    const html = map.props.source.html as string;
    expect(html).toContain('unpkg.com/leaflet');
    expect(html).toContain('tile.openstreetmap.org');
    expect(html).toContain('OpenStreetMap contributors');
    expect(html).toContain('textContent = point.title');
    expect(html).not.toContain('Google Maps');
  });

  test('keeps the empty state inside the app', async () => {
    await render(<MapPanel points={[]} emptyText="No active location." />);
    expect(screen.getByText('No active location.')).toBeTruthy();
    expect(screen.queryByTestId('in-app-map')).toBeNull();
  });

  test('opens the matching journey when an in-app map marker is tapped', async () => {
    const onSelect = jest.fn();
    await render(<MapPanel points={[point]} onSelect={onSelect} />);

    fireEvent(screen.getByTestId('in-app-map'), 'message', { nativeEvent: { data: point.id } });
    fireEvent(screen.getByTestId('in-app-map'), 'message', { nativeEvent: { data: 'unknown-id' } });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(point.id);
  });
});
