using Chanchito.Core.Services;

namespace Chanchito.Tests;

public class FormatoMonedaTests
{
    [Theory]
    [InlineData(0, "S/ 0.00")]
    [InlineData(12.5, "S/ 12.50")]
    [InlineData(1234.56, "S/ 1,234.56")]
    [InlineData(1000000, "S/ 1,000,000.00")]
    public void EnSoles_FormateaConSimboloYSeparadores(decimal monto, string esperado)
    {
        Assert.Equal(esperado, FormatoMoneda.EnSoles(monto));
    }

    [Fact]
    public void ConSigno_DistingueGastoDeIngreso()
    {
        Assert.Equal("- S/ 12.50", FormatoMoneda.ConSigno(12.5m, esGasto: true));
        Assert.Equal("+ S/ 500.00", FormatoMoneda.ConSigno(500m, esGasto: false));
    }
}
